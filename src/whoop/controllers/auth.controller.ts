// whoop.controller.ts
import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Post,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { WhoopOAuthGuard, WhoopCallbackGuard } from 'src/whoop/guards';
import type { WhoopCallbackRequest } from 'src/whoop/dtos';
import {
  WhoopCycleService,
  WhoopUserService,
  WhoopSleepService,
  WhoopRecoveryService,
  WhoopWorkoutService,
} from 'src/whoop/services';

@Controller('whoop/auth')
export class WhoopAuthController {
  constructor(
    private readonly whoopUserService: WhoopUserService,
    private readonly whoopCycleService: WhoopCycleService,
    private readonly whoopSleepService: WhoopSleepService,
    private readonly whoopRecoveryService: WhoopRecoveryService,
    private readonly whoopWorkoutService: WhoopWorkoutService,
  ) {}

  // Step 1: kick off OAuth
  @Post('/start')
  @UseGuards(FirebaseAuthGuard, WhoopOAuthGuard)
  whoopOAuthStart() {
    // Guard redirects to WHOOP automatically
    return { ok: true };
  }

  // Step 2: WHOOP redirects back here with authorization code
  @Get('/callback')
  @UseGuards(WhoopCallbackGuard)
  async whoopCallback(@Req() req: WhoopCallbackRequest, @Res() res: Response) {
    // The WhoopGuard has already exchanged the code for tokens
    // and stored them in req.whoopTokens

    if (req.whoopTokens && req.whoopUserProfile) {
      await this.whoopUserService.createWhoopUser({
        id: req.whoopUserProfile.user_id,
        access_token: req.whoopTokens.access_token,
        refresh_token: req.whoopTokens.refresh_token,
        scope: req.whoopTokens.scope,
        expires_at: req.whoopTokens.expires_at,
        user_filter: { firebase_id: req.whoopTokens.firebase_id },
        email: req.whoopUserProfile.email,
        first_name: req.whoopUserProfile.first_name,
        last_name: req.whoopUserProfile.last_name,
      });

      await this.whoopCycleService.createCycles(req.whoopUserProfile.user_id);

      await this.whoopSleepService.createSleep(req.whoopUserProfile.user_id);

      await this.whoopRecoveryService.createRecovery(
        req.whoopUserProfile.user_id,
      );

      await this.whoopWorkoutService.createWorkout(
        req.whoopUserProfile.user_id,
      );
    }

    if (req.platform === 'web') {
      return res.redirect(process.env.WEB_FRONTEND_URL!);
    } else if (req.platform === 'mobile') {
      // Use custom URL scheme for React Native Expo app
      const mobileUrl = 'sttfmobile://dashboard';
      return res.redirect(mobileUrl);
    } else {
      throw new BadRequestException('Invalid platform', req.platform);
    }
  }
}
