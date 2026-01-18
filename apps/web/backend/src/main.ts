import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activamos la validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Borra cualquier dato extra que no esté en el DTO
    forbidNonWhitelisted: true, // Lanza error si envían datos de más
    transform: true, // Permite que los tipos se conviertan y los @Transform funcionen
  }));

  // Habilitamos CORS para que tu frontend (web) pueda hablar con el backend
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();