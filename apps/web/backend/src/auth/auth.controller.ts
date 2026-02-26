import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from 'src/dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth') // Todas las rutas aquí empezarán con /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return await this.authService.signUp(body.name, body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
