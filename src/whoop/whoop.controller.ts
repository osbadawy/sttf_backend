// whoop.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('api/auth/whoop')
export class WhoopController {
  constructor() {}

  // Step 1: kick off OAuth (Passport builds the URL)
  @Get('start')
  @UseGuards(AuthGuard('whoop'))
  async whoopLogin() {
    // Guard redirects to WHOOP automatically
  }

  // Step 2: WHOOP redirects back here
  @Get('callback')
  @UseGuards(AuthGuard('whoop'))
  async whoopCallback(@Req() req: any, @Res() res: Response) {
    // req.user comes from validate()
    const whoopAccount = req.user;

    // redirect back to your frontend
    const successUrl = process.env.APP_WEB_SUCCESS_URL!;
    return res.redirect(successUrl);
  }
}
