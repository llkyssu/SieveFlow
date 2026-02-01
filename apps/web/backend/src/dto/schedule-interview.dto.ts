import { IsInt, IsDateString, IsUrl, IsNotEmpty } from 'class-validator';

export class ScheduleInterviewDto {
  @IsInt()
  applicationId!: number;

  @IsDateString()
  scheduledAt!: string;

  @IsUrl({}, { message: 'El link de la reunión debe ser una URL válida' })
  @IsNotEmpty()
  meetingLink!: string;
}