import { Controller, UseGuards, Post, Get, Body, Req } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateJobDto } from '../dto/create-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createJob(@Body() body: CreateJobDto, @Req() req) {
    const recruiterId = req.user.userId;

    return await this.jobsService.createJob(body, recruiterId);
  }

  @Get('/')
  async findAllJobs() {
    return await this.jobsService.getAllJobs();
  }
}
