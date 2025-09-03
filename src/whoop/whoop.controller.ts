// whoop.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { WhoopOAuthGuard, WhoopCallbackGuard } from './whoop.guard';
import { WhoopService } from './whoop.service';
import type { WhoopRequest } from './dtos';

@Controller('whoop')
export class WhoopController {
  constructor(private readonly whoopService: WhoopService) {}

  // Step 1: kick off OAuth
  @Get('/auth/start')
  @UseGuards(FirebaseAuthGuard, WhoopOAuthGuard)
  whoopLogin() {
    // Guard redirects to WHOOP automatically
    return { ok: true };
  }

  // Step 2: WHOOP redirects back here with authorization code
  @Get('/auth/callback')
  @UseGuards(WhoopCallbackGuard)
  async whoopCallback(@Req() req: WhoopRequest, @Res() res: Response) {
    // The WhoopGuard has already exchanged the code for tokens
    // and stored them in req.whoopTokens

    if (req.whoopTokens) {
      const {
        authorization_token,
        access_token,
        refresh_token,
        expires_at,
        user_id,
        scope,
      } = req.whoopTokens;
      await this.whoopService.createWhoopAuth({
        authorization_token,
        access_token,
        refresh_token,
        expires_at,
        firebase_id: user_id,
        scope,
      });
    }

    return res.redirect(process.env.APP_WEB_SUCCESS_URL!);
  }
}
