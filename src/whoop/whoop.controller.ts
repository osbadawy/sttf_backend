// whoop.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { WhoopOAuthGuard, WhoopCallbackGuard } from './whoop.guard';
import { WhoopService } from './whoop.service';
import type { WhoopCallbackRequest } from './dtos';

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
  async whoopCallback(@Req() req: WhoopCallbackRequest, @Res() res: Response) {
    // The WhoopGuard has already exchanged the code for tokens
    // and stored them in req.whoopTokens

    if (req.whoopTokens && req.whoopUserProfile) {
      await this.whoopService.createWhoopUser({
        whoopTokens: req.whoopTokens,
        whoopUserProfile: req.whoopUserProfile,
      });
    }

    return res.redirect(process.env.APP_WEB_SUCCESS_URL!);
  }
}
