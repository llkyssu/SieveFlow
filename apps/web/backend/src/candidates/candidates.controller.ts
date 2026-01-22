import { 
  Controller, 
  Post, 
  Patch, 
  Body, 
  Param, 
  UseInterceptors, 
  UploadedFile, 
  ParseIntPipe,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatesService } from './candidates.service';
import { NewCandidateDto } from '../dto/new-candidate.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post('new-candidate')
  async createCandidate(@Body() dto: NewCandidateDto) {
    return await this.candidatesService.findOrCreateCandidate(dto);
  }

  @Patch('update-candidate')
  async updateCandidate(@Body() dto: NewCandidateDto) {
    return await this.candidatesService.updateCandidate(dto);
  }

  @Post(':id/resume')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @Param('id', ParseIntPipe) id: number,
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
    return await this.candidatesService.uploadDefaultResume(id, file);
  }
}