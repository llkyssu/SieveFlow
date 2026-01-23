import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseInterceptors, 
  UploadedFiles, 
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { NlpResponseDto } from '../dto/nlp-response.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'resume', maxCount: 1 },
    { name: 'coverLetter', maxCount: 1 },
  ]))
  async apply(
    @Body() dto: CreateApplicationDto, 
    @UploadedFiles() files: { resume?: Express.Multer.File[], coverLetter?: Express.Multer.File[] },
  ) {
    const resume = files.resume?.[0];
    if (!resume) throw new BadRequestException('El CV (resume) es obligatorio');

    return await this.applicationsService.createApplication(
      dto, 
      resume, 
      files.coverLetter?.[0]
    );
  }

  @Post('webhook/nlp-result')
  async handleNlpWebhook(@Body() data: NlpResponseDto) {
    return await this.applicationsService.updateWithAiAnalysis(data);
  }

  @Get(':id')
  async getApplication(@Param('id', ParseIntPipe) id: number) {
    return await this.applicationsService.findById(id);
  }

  @Get('jobs/:jobId')
  async getByJob(@Param('jobId', ParseIntPipe) jobId: number) {
    return await this.applicationsService.findByJob(jobId);
  }
}