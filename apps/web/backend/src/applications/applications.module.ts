import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config'; 
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { NlpClientService } from './nlp-client.service'; 
import { ResumesModule } from '../resumes/resumes.module'; 

@Module({
  imports: [
    ResumesModule, 
    HttpModule,   
    ConfigModule,  
  ],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService, 
    NlpClientService 
  ],
})
export class ApplicationsModule {}