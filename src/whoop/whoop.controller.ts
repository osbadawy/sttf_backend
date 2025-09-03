// whoop.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('whoop')
export class WhoopController {
  constructor() {}

  // Step 1: kick off OAuth (Passport builds the URL)
  @Get('/auth/start')
  @UseGuards(AuthGuard('whoop'))
  whoopLogin() {
    // Guard redirects to WHOOP automatically
    return { ok: true };
  }

  // // Step 2: WHOOP redirects back here
  @Get('/auth/callback')
  @UseGuards(AuthGuard('whoop'))
  whoopCallback(@Req() req: any, @Res() res: Response) {
    // req.user comes from validate()
    // const whoopAccount = req.user;

    // redirect back to your frontend
    const successUrl = process.env.APP_WEB_SUCCESS_URL!;
    return res.redirect(successUrl);
  }
}
