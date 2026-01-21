import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { NlpResponseDto } from '../dto/nlp-response.dto';

@Injectable()
export class ApplicationsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}
  
  async create(jobId: number, candidateId: number) {
    const [newApplication] = await this.db
      .insert(schema.applications)
      .values({
        jobId,
        candidateId,
        status: 'pending', // Estado inicial
      })
      .returning();
    
    return newApplication;
  }
  
  async updateWithAiAnalysis(data: NlpResponseDto) {
    return await this.db
      .update(schema.applications)
      .set({
        aiScore: data.score,
        aiAnalysisSummary: data.summary,
        resumeRawText: data.rawText,
        status: 'reviewed',
      })
      .where(eq(schema.applications.id, data.applicationId))
      .returning();
  }
}
