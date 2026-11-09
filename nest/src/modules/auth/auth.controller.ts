import { Body, Controller, Get, Post } from '@nestjs/common';
import { Auth } from './auth.decorator.js';
import { AuthService } from './auth.service.js';

interface LoginRequestBody {
  username?: string;
  password?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginRequestBody) {
    return this.authService.login(body?.username ?? '', body?.password ?? '');
  }
}

@Controller()
export class PilotController {
  constructor(private readonly authService: AuthService) {}

  @Auth()
  @Get('pilot/me')
  getPilotProfile() {
    return this.authService.getPilotProfile();
  }

  @Auth()
  @Get('profile/me')
  getProfile() {
    return this.authService.getPilotProfile();
  }
}
