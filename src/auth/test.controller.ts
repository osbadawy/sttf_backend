import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email?: string;
    claims: any;
  };
}

@Controller('auth')
export class TestAuthController {
  @Get('health')
  health() {
    return { ok: true };
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
