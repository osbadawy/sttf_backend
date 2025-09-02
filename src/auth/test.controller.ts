import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Controller('auth')
export class TestAuthController {
  @Get('health')
  health() {
    return { ok: true };
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user; 
  }
}
