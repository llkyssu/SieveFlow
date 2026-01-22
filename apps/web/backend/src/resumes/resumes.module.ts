import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';

@Module({
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}