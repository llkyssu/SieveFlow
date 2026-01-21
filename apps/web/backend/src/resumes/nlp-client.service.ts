// apps/web/backend/src/resumes/nlp-client.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NlpClientService {
  private readonly logger = new Logger(NlpClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  notifyNlpService(applicationId: number, filePath: string, jobRequirements: string): void {
    const url = this.configService.get<string>('NLP_SERVICE_URL');
    
    // Payload exacto para el modelo Pydantic de Python
    const payload = { 
      applicationId, 
      filePath, 
      jobRequirements 
    };

    if (!url) {
      this.logger.error('La URL del servicio NLP no está definida en el .env global');
      return;
    }

    lastValueFrom(this.httpService.post(url, payload))
      .then(() => this.logger.log(`NLP: Notificación enviada para App ${applicationId}`))
      .catch((err) => {
        const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        this.logger.error(`NLP: Error 422/500 desde Python: ${detail}`);
      });
  }
}