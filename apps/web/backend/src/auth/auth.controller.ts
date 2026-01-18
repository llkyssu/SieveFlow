import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from 'src/dto/auth.dto';

@Controller('auth') // Todas las rutas aquí empezarán con /auth
export class AuthController {
  // Aquí inyectamos el servicio para poder usar sus métodos
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    try {
      return await this.authService.signUp(
        body.name,
        body.email,
        body.password,
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error');
    }
  }
  @Post('login')
  async login(@Body() body: LoginDto) {
    try {
      return await this.authService.login(body.email, body.password);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error');
    }
  }
}
