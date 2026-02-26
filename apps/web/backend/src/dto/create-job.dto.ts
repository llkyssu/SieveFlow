import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
    title!: string;

  @IsString()
  @IsNotEmpty()
    description!: string;

  @IsObject()
  @IsNotEmpty()
    requirements: any;

  @IsObject()
  @IsOptional()
    hiddenRequirements?: any;
}