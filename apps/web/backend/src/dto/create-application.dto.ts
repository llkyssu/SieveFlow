import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApplicationDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  jobId!: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  candidateId!: number;
}