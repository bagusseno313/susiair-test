import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

export const Auth = () =>
  applyDecorators(UseGuards(JwtAuthGuard), SetMetadata('requiresAuth', true));
