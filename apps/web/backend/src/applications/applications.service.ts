import { Injectable, Inject, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { ResumesService } from '../resumes/resumes.service';
import { NlpClientService } from './nlp-client.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { NlpResponseDto } from '../dto/nlp-response.dto';

// Definición de tipos para mayor control del flujo
export type ApplicationStatus = 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired';
export type ApplicationDecision = 'ADVANCE' | 'HOLD' | 'REJECT';

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

    // REGLA: No contratar si la IA lo rechazó
    if (status === 'hired' && application.decision === 'REJECT') {
      throw new BadRequestException('No se puede contratar a un candidato marcado como REJECT por el sistema.');
    }

    // REGLA: Si pasa a entrevista, asegurar que la decisión sea ADVANCE o HOLD
    if (status === 'interview' && application.decision === 'REJECT') {
      throw new BadRequestException('No puedes entrevistar a un candidato rechazado.');
    }

    // Sincronización de decisión automática al rechazar
    const updateData: any = { status };
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