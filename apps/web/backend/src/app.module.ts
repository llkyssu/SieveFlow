import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ResumesModule } from './resumes/resumes.module';
import { ApplicationsModule } from './applications/applications.module';
import { JobsModule } from './jobs/jobs.module';
import { CandidatesModule } from './candidates/candidates.module';
import { InterviewsService } from './interviews/interviews.service';
import { InterviewsModule } from './interviews/interviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '..', '..', '..', '.env'),
    }),
    DrizzleModule,
    AuthModule,
    ResumesModule,
    ApplicationsModule,
    JobsModule,
    CandidatesModule,
    InterviewsModule,
  ],
  controllers: [], 
  providers: [InterviewsService], 
})
export class AppModule {}