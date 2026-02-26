// apps/web/backend/src/resumes/dto/upload-resume.dto.ts
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class NewCandidateDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
    firstName!: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
    lastName!: string;

  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
    email!: string;

  @IsString()
  @IsOptional()
    phone?: string;

  @IsUrl({}, { message: 'La URL de LinkedIn no es válida' })
  @IsOptional()
    linkedinUrl?: string;
}
