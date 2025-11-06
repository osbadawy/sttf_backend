// whoop.controller.ts
import { Controller, UseGuards, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WhoopWebhookService } from 'src/whoop/services';
import { WhoopWebhookAccessTokenGuard } from 'src/whoop/guards';
import { WhoopAccessTokens } from 'src/whoop/dtos/whoop_user.dto';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

interface RequestWithWhoopAccess extends Request {
  whoop_access: WhoopAccessTokens;
}

@Controller('whoop/webhook')
export class WhoopWebhookController {
  constructor(private readonly whoopWebhookService: WhoopWebhookService) {}

  @Post('/all')
  @Roles('admin')
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  async updateAllWhoopData() {
    return await this.whoopWebhookService.updateAllWhoopData();
  }

  @UseGuards(WhoopWebhookAccessTokenGuard)
  @Post('/:client_id')
  async whoopWebhook(@Body() body: any, @Req() req: RequestWithWhoopAccess) {
    await this.whoopWebhookService.handleWebhook(
      body,
      req.whoop_access.access_token,
    );
    return { ok: true };
  }
}
