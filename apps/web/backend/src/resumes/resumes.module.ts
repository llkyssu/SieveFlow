import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { HttpModule } from '@nestjs/axios';
import { NlpClientService } from './nlp-client.service';

@Module({
  imports: [HttpModule],
  controllers: [ResumesController],
  providers: [ResumesService, NlpClientService],
})
export class ResumesModule {}
