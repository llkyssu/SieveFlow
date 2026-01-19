import { IsInt, IsString, Min, Max } from 'class-validator';

export class NlpResponseDto {
  @IsInt()
  applicationId!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsString()
  summary!: string;

  @IsString()
  rawText!: string;
}