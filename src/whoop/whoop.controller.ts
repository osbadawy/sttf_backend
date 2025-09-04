// whoop.controller.ts
import { Controller, Get, Req, Res, UseGuards, Post } from '@nestjs/common';
import type { Response } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { WhoopOAuthGuard, WhoopCallbackGuard } from './whoop.guard';
import type { WhoopCallbackRequest } from './dtos';
import {
  WhoopCycleService,
  WhoopUserService,
  WhoopSleepService,
  WhoopRecoveryService,
} from './services';

@Controller('whoop')
export class WhoopController {
  constructor(
    private readonly whoopUserService: WhoopUserService,
    private readonly whoopCycleService: WhoopCycleService,
    private readonly whoopSleepService: WhoopSleepService,
    private readonly whoopRecoveryService: WhoopRecoveryService,
  ) {}

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
      await this.whoopUserService.createWhoopUser({
        whoopTokens: req.whoopTokens,
        whoopUserProfile: req.whoopUserProfile,
      });

      await this.whoopCycleService.createCycles(req.whoopUserProfile.user_id);

      await this.whoopSleepService.createSleep(req.whoopUserProfile.user_id);
    }

    return res.redirect(process.env.APP_WEB_SUCCESS_URL!);
  }

  @Post('cycle')
  async test(@Req() req: Request) {
    if ('whoop_user_id' in req.body!) {
      return await this.whoopCycleService.createCycles(
        req.body.whoop_user_id as number,
      );
    }
  }

  @Post('sleep')
  async createSleep(@Req() req: Request) {
    if ('whoop_user_id' in req.body!) {
      return await this.whoopSleepService.createSleep(
        req.body.whoop_user_id as number,
      );
    }
    throw new Error('whoop_user_id is required');
  }

  @Post('recovery')
  async createRecovery(@Req() req: Request) {
    if ('whoop_user_id' in req.body!) {
      return await this.whoopRecoveryService.createRecovery(
        req.body.whoop_user_id as number,
      );
    }
  }
}
