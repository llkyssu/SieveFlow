import { IsString, IsNotEmpty, IsObject } from 'class-validator';

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
}
