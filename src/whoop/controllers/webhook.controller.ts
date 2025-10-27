// whoop.controller.ts
import { Controller, UseGuards, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WhoopWebhookService } from 'src/whoop/services';
import { WhoopWebhookAccessTokenGuard } from 'src/whoop/guards';
import { WhoopAccessTokens } from 'src/whoop/dtos/whoop_user.dto';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';

interface RequestWithWhoopAccess extends Request {
  whoop_access: WhoopAccessTokens;
}

@Controller('whoop/webhook')
export class WhoopWebhookController {
  constructor(private readonly whoopWebhookService: WhoopWebhookService) {}

  @UseGuards(WhoopWebhookAccessTokenGuard)
  @Post('/')
  async whoopWebhook(@Body() body: any, @Req() req: RequestWithWhoopAccess) {
    await this.whoopWebhookService.handleWebhook(
      body,
      req.whoop_access.access_token,
    );
    return { ok: true };
  }

  @Post('/all')
  @UseGuards(FirebaseAuthGuard)
  async updateAllWhoopData(@Req() req: Request & { user: { uid: string } }) {
    return await this.whoopWebhookService.updateAllWhoopData();
  }
}
