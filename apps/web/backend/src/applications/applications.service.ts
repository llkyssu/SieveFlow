import { Injectable, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { ResumesService } from '../resumes/resumes.service';
import { NlpClientService } from './nlp-client.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { NlpResponseDto } from '../dto/nlp-response.dto';

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
          status: 'pending',
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

  async updateWithAiAnalysis(data: NlpResponseDto) {
    const [updatedApp] = await this.db
      .update(schema.applications)
      .set({
        aiScore: data.score,
        aiAnalysisSummary: data.summary,
        resumeRawText: data.rawText,
        status: 'reviewed',
        coverLetterRawText: data.coverLetterText || null,
        decision: data.decision || null
      })
      .where(eq(schema.applications.id, data.applicationId))
      .returning();

    if (!updatedApp) throw new NotFoundException('Aplicación no encontrada');
    return updatedApp;
  }

  async findOne(id: number) {
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