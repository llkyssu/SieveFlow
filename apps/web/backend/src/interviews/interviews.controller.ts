import { Controller, Param, ParseIntPipe, Post, Patch, Get, Body } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { ScheduleInterviewDto } from '../dto/schedule-interview.dto';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('schedule')
  scheduleInterview(@Body() dto: ScheduleInterviewDto) {
    return this.interviewsService.scheduleInterview(dto);
  }

  @Patch(':id/update')
  async updateInterview(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: Partial<ScheduleInterviewDto> 
  ) {
    return this.interviewsService.updateInterview(id, dto);
  }

  @Get(':id')
  async getInterview(@Param('id', ParseIntPipe) id: number) {
    return this.interviewsService.getInterviewById(id);
  }

  @Get('application/:applicationId')
  async getInterviewsByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.interviewsService.getInterviewsByAppId(applicationId);
  }

  @Patch(':id/cancel')
  async cancelInterview(@Param('id', ParseIntPipe) interviewId: number) {
    return this.interviewsService.cancelInterview(interviewId);
  }
}