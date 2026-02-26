// apps/web/backend/src/dto/upload-resume.dto.ts
import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadResumeDto {
  @Type(() => Number) // Esto convierte el string del form-data a número
  @IsInt({ message: 'El campo candidateId debe ser un número.' })
  @IsNotEmpty({ message: 'El campo candidateId es obligatorio.' })
  candidateId!: number;
}