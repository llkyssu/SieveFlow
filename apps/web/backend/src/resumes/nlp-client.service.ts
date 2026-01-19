import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config'; 
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NlpClientService {
  private readonly logger = new Logger(NlpClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService 
  ) {}

  notifyNlpService(applicationId: number, filePath: string): void {
    const url = this.configService.get<string>('NLP_SERVICE_URL');
    const payload = { applicationId, filePath };

    if (!url) {
      this.logger.error('La URL del servicio NLP no está definida en el .env');
      return;
    }
    // se usa lastValueFrom para convertir el Observable en una Promesa
    lastValueFrom(this.httpService.post(url, payload))
      .then(() => this.logger.log(`Notificación exitosa para aplicación ${applicationId}`))
      .catch((err) => this.logger.error(`Fallo al contactar Python: ${err.message}`));
  }
}