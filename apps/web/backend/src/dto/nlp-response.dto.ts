import { IsNumber, IsString, IsOptional } from 'class-validator';

export class NlpResponseDto {
  @IsNumber()
  applicationId!: number;

  @IsNumber()
  score!: number;

  @IsString()
  summary!: string;

  @IsString()
  rawText!: string;

  @IsString()
  @IsOptional()
  coverLetterText?: string;

  @IsString()
  @IsOptional()
  decision?: string; 
}