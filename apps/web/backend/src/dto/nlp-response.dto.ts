import { IsNumber, IsString, IsOptional, IsIn, Min, Max } from 'class-validator';

export const APPLICATION_DECISIONS = ['ADVANCE', 'HOLD', 'REJECT'] as const;
export type ApplicationDecision = typeof APPLICATION_DECISIONS[number];

export class NlpResponseDto {
  @IsNumber()
  applicationId!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @IsString()
  summary!: string;

  @IsString()
  rawText!: string;

  @IsString()
  @IsOptional()
  coverLetterText?: string;

  @IsIn(APPLICATION_DECISIONS, { message: 'decision debe ser ADVANCE, HOLD o REJECT' })
  @IsOptional()
  decision?: ApplicationDecision;
}