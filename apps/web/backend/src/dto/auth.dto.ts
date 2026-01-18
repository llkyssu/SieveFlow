import { IsEmail, MinLength, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Transform(({ value }) => value?.trim()) // Elimina espacios en blanco innecesarios
  name!: string;

  @IsEmail({}, { message: 'El formato del correo es incorrecto' })
  @Transform(({ value }) => value?.toLowerCase().trim()) // Siempre minúsculas y sin espacios
  email!: string;

  @IsString()
  @MinLength(12, { message: 'La clave debe tener al menos 12 caracteres' })
  // Podrías añadir @Matches para forzar mayúsculas/números si quieres más seguridad
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'El formato del correo es incorrecto' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}