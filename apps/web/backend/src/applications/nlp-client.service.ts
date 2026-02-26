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

  async notifyNlpService(applicationId: number, filePath: string, jobRequirements: string): Promise<void> {
    const url = this.configService.get<string>('NLP_SERVICE_URL');
    
    const payload = { 
      applicationId, 
      filePath, 
      jobRequirements 
    };

    if (!url) return;

    await lastValueFrom(this.httpService.post(url, payload));
  }
}