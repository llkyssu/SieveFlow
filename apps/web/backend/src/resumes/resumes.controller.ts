// apps/web/backend/src/resumes/resumes.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumesService } from './resumes.service';
import { NewCandidateDto } from '../dto/new-candidate.dto';
import { UploadResumeDto } from '../dto/upload-resume.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post('new-candidate')
  async createCandidate(@Body() dto: NewCandidateDto) {
    return await this.resumesService.findOrCreateCandidate(dto);
  }

  @Patch('update-candidate')
  async updateCandidate(@Body() dto: NewCandidateDto) {
    return await this.resumesService.updateCandidate(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-resume')
  @UseInterceptors(FileInterceptor('file'))
  async updateResume(
    @Body() dto: UploadResumeDto, // Usamos el DTO oficial
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // Si llegamos aquí, class-validator ya aseguró que candidateId es un número
    return await this.resumesService.updateResume(dto.candidateId, file);
  }
}