import { Injectable, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';
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

  async createApplication(dto: CreateApplicationDto, file: Express.Multer.File) {
    const job = await this.db.query.jobs.findFirst({
      where: eq(schema.jobs.id, dto.jobId),
    });

    if (!job) throw new NotFoundException('El trabajo especificado no existe');

    const storage = await this.resumesService.saveFile(file, 'resumes');

    try {
      const [newApplication] = await this.db
        .insert(schema.applications)
        .values({
          jobId: dto.jobId,
          candidateId: dto.candidateId,
          resumeUrl: storage.publicUrl,
          status: 'pending',
        })
        .returning();

      const combinedRequirements = JSON.stringify({
        public: job.requirements,
        hidden: (job as any).hiddenRequirements || null 
      });

      this.nlpClientService.notifyNlpService(
        newApplication.id,
        storage.absolutePath,
        combinedRequirements
      );

      return newApplication;

    } catch (error) {
      await this.resumesService.removeFile(storage.absolutePath);
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
      })
      .where(eq(schema.applications.id, data.applicationId))
      .returning();

    if (!updatedApp) throw new NotFoundException(`Application ID ${data.applicationId} not found`);
    
    return updatedApp;
  }

  async findOne(id: number) {
    const app = await this.db.query.applications.findFirst({
      where: eq(schema.applications.id, id),
      with: {
        job: true,
        candidate: true,
      }
    });
    if (!app) throw new NotFoundException('Aplicación no encontrada');
    return app;
  }
}