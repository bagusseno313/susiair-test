import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const VALID_USERNAME = 'johndoe';
const VALID_PASSWORD = 'susiairtest';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  validateCredentials(username: string, password: string): boolean {
    return username === VALID_USERNAME && password === VALID_PASSWORD;
  }

  login(username: string, password: string) {
    if (!this.validateCredentials(username, password)) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = { sub: username, username };

    return {
      access_token: this.jwtService.sign(payload),
      tokenType: 'Bearer',
    };
  }

  getPilotProfile() {
    return {
      name: 'John Doe',
      totalFlightHours: 1444.5,
      avatarUrl: '/pilot-avatar.webp',
    };
  }
}
