// apps/web/backend/src/resumes/resumes.controller.ts
import { 
  Controller, Post, Body, UseGuards, Patch, 
  UseInterceptors, UploadedFile, ParseFilePipe, 
  MaxFileSizeValidator, FileTypeValidator 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumesService } from './resumes.service';
import { NewCandidateDto } from '../dto/new-candidate.dto'; 
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
  // 1. Interceptamos el campo 'file' que viene en el FormData
  @UseInterceptors(FileInterceptor('file')) 
  async updateResume(
    // 2. Extraemos el ID del candidato desde el body del request
    @Body('candidateId') candidateId: string, 
    // 3. Capturamos y validamos el archivo
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // Límite de 5MB
          new FileTypeValidator({ fileType: 'application/pdf' }), // Solo PDFs
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    // 4. Delegamos la lógica al servicio
    return await this.resumesService.updateResume(
      parseInt(candidateId), 
      file
    );
  }
}