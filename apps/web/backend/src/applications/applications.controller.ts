import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { NlpResponseDto } from '../dto/nlp-response.dto';

@Controller('applications')
export class ApplicationsController {
  private readonly logger = new Logger(ApplicationsController.name);

  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('webhook/nlp-result')
  async handleNlpResult(@Body() data: NlpResponseDto) {
    this.logger.log(`Recibido análisis para Aplicación ID: ${data.applicationId}`);
    
    return await this.applicationsService.updateWithAiAnalysis(data);
  }
}