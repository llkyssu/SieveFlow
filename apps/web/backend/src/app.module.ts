// apps/web/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ResumesModule } from './resumes/resumes.module';
import { ApplicationsService } from './applications/applications.service';
import { ApplicationsController } from './applications/applications.controller';
import { ApplicationsModule } from './applications/applications.module';

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
  ],
  providers: [ApplicationsService],
  controllers: [ApplicationsController],
})
export class AppModule {}