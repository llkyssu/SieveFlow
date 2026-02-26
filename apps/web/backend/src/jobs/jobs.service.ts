import {
  Injectable,
  Inject,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { CreateJobDto } from 'src/dto/create-job.dto';
import { eq, isNull } from 'drizzle-orm';

@Injectable()
export class JobsService {
  constructor(
        @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createJob(body: CreateJobDto, recruiterId: number) {
    if (!recruiterId) {
      throw new UnauthorizedException('Recruiter ID is required to create a job.');
    }

    const [existingRecruiter] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, recruiterId))
      .limit(1);

    if (!existingRecruiter) {
      throw new NotFoundException('Recruiter not found.');
    }

    const [newJob] = await this.db
      .insert(schema.jobs)
      .values({
        ...body,
        recruiterId: recruiterId, 
      })
      .returning();

    return newJob;
  }

  async getAllJobs() {
    const jobs = await this.db
      .select()
      .from(schema.jobs)
      .where(isNull(schema.jobs.deletedAt));
    return jobs;
  }
}
