import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseInterceptors, 
  UploadedFile, 
  ParseFilePipe, 
  MaxFileSizeValidator, 
  FileTypeValidator,
  ParseIntPipe 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { NlpResponseDto } from '../dto/nlp-response.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async apply(
    @Body() dto: CreateApplicationDto, 
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
    return await this.applicationsService.createApplication(dto, file);
  }

  @Post('webhook/nlp-result')
  async handleNlpWebhook(@Body() data: NlpResponseDto) {
    return await this.applicationsService.updateWithAiAnalysis(data);
  }

  @Get(':id')
  async getApplication(@Param('id', ParseIntPipe) id: number) {
    return await this.applicationsService.findOne(id);
  }
}