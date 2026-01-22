import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NlpClientService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  notifyNlpService(applicationId: number, filePath: string, jobRequirements: string): void {
    const url = this.configService.get<string>('NLP_SERVICE_URL');
    
    const payload = { 
      applicationId, 
      filePath, 
      jobRequirements 
    };

    if (!url) return;

    lastValueFrom(this.httpService.post(url, payload)).catch(() => {});
  }
}