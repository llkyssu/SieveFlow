import { Injectable, Inject, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { ResumesService } from '../resumes/resumes.service';
import { NlpClientService } from './nlp-client.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { NlpResponseDto } from '../dto/nlp-response.dto';

// Tipos inferidos del schema (deben coincidir con pgEnum)
export type ApplicationStatus = 'pending' | 'processing' | 'reviewed' | 'interview' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
export type ApplicationDecision = 'ADVANCE' | 'HOLD' | 'REJECT';

// Constantes de flujo de trabajo
const TERMINAL_STATES: ApplicationStatus[] = ['rejected', 'hired', 'withdrawn'];
const RESET_STATE: ApplicationStatus = 'reviewed';

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly resumesService: ResumesService,
    private readonly nlpClientService: NlpClientService,
  ) {}

  async createApplication(dto: CreateApplicationDto, resumeFile: Express.Multer.File, coverFile?: Express.Multer.File) {
    const job = await this.db.query.jobs.findFirst({
      where: eq(schema.jobs.id, dto.jobId),
    });

    if (!job) throw new NotFoundException('El trabajo no existe');

    if (job.status !== 'open') {
      throw new BadRequestException('No se pueden postular a trabajos que no están abiertos');
    }

    const resumeStorage = await this.resumesService.saveFile(resumeFile, 'resumes');
    let coverUrl: string | null = null;
    let coverPath: string | null = null;

    if (coverFile) {
      const coverStorage = await this.resumesService.saveFile(coverFile, 'covers');
      coverUrl = coverStorage.publicUrl;
      coverPath = coverStorage.absolutePath;
    }

    try {
      const [newApplication] = await this.db
        .insert(schema.applications)
        .values({
          jobId: dto.jobId,
          candidateId: dto.candidateId,
          resumeUrl: resumeStorage.publicUrl,
          coverLetterUrl: coverUrl,
          status: 'pending', // Estado inicial de la cascada
        })
        .returning();

      const nlpPayload = JSON.stringify({
        public_criteria: job.requirements,
        secret_criteria: (job as any).hiddenRequirements || null,
        resumePath: resumeStorage.absolutePath,
        coverLetterPath: coverPath
      });

      this.nlpClientService.notifyNlpService(
        newApplication.id,
        resumeStorage.absolutePath,
        nlpPayload
      );

      return newApplication;
    } catch (error) {
      await this.resumesService.removeFile(resumeStorage.absolutePath);
      if (coverPath) await this.resumesService.removeFile(coverPath);
      throw new InternalServerErrorException('Error al procesar la postulación');
    }
  }

  async updateStatus(id: number, status: ApplicationStatus) {
    const application = await this.findById(id);
    const currentStatus = application.status as ApplicationStatus;

    // ═══════════════════════════════════════════════════════════════════
    // REGLA 1: ESTADOS TERMINALES - No se puede salir sin reconsideración
    // ═══════════════════════════════════════════════════════════════════
    if (TERMINAL_STATES.includes(currentStatus) && currentStatus !== status) {
      throw new BadRequestException(
        `No se puede cambiar el estado desde '${currentStatus}'. ` +
        `Use el método 'reconsider' para reactivar esta postulación.`
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // REGLA 2: BARRERA DE DECISIÓN - La IA tiene voz en el flujo
    // ═══════════════════════════════════════════════════════════════════
    if (application.decision === 'REJECT') {
      if (status === 'hired') {
        throw new BadRequestException(
          'No se puede contratar a un candidato marcado como REJECT por el sistema.'
        );
      }
      if (status === 'interview') {
        throw new BadRequestException(
          'No se puede entrevistar a un candidato rechazado. Use reconsider primero.'
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // REGLA 3: HOLD requiere revisión manual antes de avanzar
    // ═══════════════════════════════════════════════════════════════════
    if (application.decision === 'HOLD' && status === 'hired') {
      throw new BadRequestException(
        'No se puede contratar directamente a un candidato en HOLD. Primero debe pasar por entrevista.'
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // SINCRONIZACIÓN: Mantener consistencia decision <-> status
    // ═══════════════════════════════════════════════════════════════════
    const updateData: Partial<typeof schema.applications.$inferInsert> = { status };
    if (status === 'rejected') {
      updateData.decision = 'REJECT';
    }

    const [updated] = await this.db
      .update(schema.applications)
      .set(updateData)
      .where(eq(schema.applications.id, id))
      .returning();

    return updated;
  }

  /**
   * RECONSIDERAR - Salida de emergencia para estados terminales
   * 
   * Este método permite "revivir" una postulación rechazada.
   * El candidato vuelve al estado 'reviewed' y su decisión se limpia,
   * permitiendo que el flujo normal continúe.
   * 
   * Casos de uso:
   * - Error humano: reclutador rechazó al candidato equivocado
   * - Nueva vacante: candidato rechazado para un puesto ahora es apto para otro
   * - Reconsideración: después de revisar manualmente el caso
   */
  async reconsider(id: number, reason?: string) {
    const application = await this.findById(id);
    const currentStatus = application.status as ApplicationStatus;

    // Solo se puede reconsiderar desde estados terminales
    if (!TERMINAL_STATES.includes(currentStatus)) {
      throw new BadRequestException(
        `Solo se pueden reconsiderar postulaciones en estados terminales (rejected, hired). ` +
        `Estado actual: '${currentStatus}'`
      );
    }

    // No reconsiderar a alguien ya contratado (hired es final-final)
    if (currentStatus === 'hired') {
      throw new BadRequestException(
        'No se puede reconsiderar a un candidato ya contratado.'
      );
    }

    const [updated] = await this.db
      .update(schema.applications)
      .set({
        status: RESET_STATE,
        decision: null, // Limpiamos la decisión para permitir nueva evaluación
      })
      .where(eq(schema.applications.id, id))
      .returning();

    return {
      ...updated,
      _reconsidered: true,
      _previousStatus: currentStatus,
      _reason: reason || 'No especificada',
    };
  }

  async updateWithAiAnalysis(data: NlpResponseDto) {
    if (data.decision && !['ADVANCE', 'HOLD', 'REJECT'].includes(data.decision)) {
      throw new InternalServerErrorException('Decisión inválida');
    }

    if (data.score < 0 || data.score > 100) {
      throw new InternalServerErrorException('Puntaje inválido');
    }

    // Determinamos el siguiente paso en el "tobogán" según la IA
    const nextStatus: ApplicationStatus = data.decision === 'REJECT' ? 'rejected' : 'reviewed';

    const [updatedApp] = await this.db
      .update(schema.applications)
      .set({
        aiScore: data.score,
        aiAnalysisSummary: data.summary,
        resumeRawText: data.rawText,
        coverLetterRawText: data.coverLetterText || null,
        decision: (data.decision as ApplicationDecision) || null,
        status: nextStatus,
      })
      .where(eq(schema.applications.id, data.applicationId))
      .returning();

    if (!updatedApp) throw new NotFoundException('Aplicación no encontrada');
    return updatedApp;
  }

  async findById(id: number) {
    const app = await this.db.query.applications.findFirst({
      where: eq(schema.applications.id, id),
      with: { job: true, candidate: true }
    });
    if (!app) throw new NotFoundException('Aplicación no encontrada');
    return app;
  }

  async findByJob(jobId: number) {
    return await this.db.query.applications.findMany({
      where: eq(schema.applications.jobId, jobId),
      with: { job: true, candidate: true },
      orderBy: desc(schema.applications.aiScore),
    });
  }
}