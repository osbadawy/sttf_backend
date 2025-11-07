// whoop.controller.ts
import { Controller, UseGuards, Post, Body, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('Whoop Webhook')
@Controller('whoop/webhook')
export class WhoopWebhookController {
  constructor(private readonly whoopWebhookService: WhoopWebhookService) {}

  @Post('/all')
  @Roles('admin')
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Update all Whoop data (Admin only)',
    description:
      '**Roles:** admin\n\n' +
      '**Access:** Only admins can manually trigger a full update of Whoop data for all users\n\n' +
      '**Restrictions:** Players, coaches, and nutritionists cannot trigger full updates',
  })
  @ApiResponse({
    status: 200,
    description: 'All Whoop data updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async updateAllWhoopData() {
    return await this.whoopWebhookService.updateAllWhoopData();
  }

  @UseGuards(WhoopWebhookAccessTokenGuard)
  @Post('/:client_id')
  @ApiOperation({
    summary: 'Handle Whoop webhook',
    description:
      '**Roles:** Webhook endpoint (secured by WhoopWebhookAccessTokenGuard)\n\n' +
      '**Access:** Receives and processes webhook events from Whoop servers. Requires valid Whoop access token for the specified client_id',
  })
  @ApiParam({ name: 'client_id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async whoopWebhook(@Body() body: any, @Req() req: RequestWithWhoopAccess) {
    await this.whoopWebhookService.handleWebhook(
      body,
      req.whoop_access.access_token,
    );
    return { ok: true };
  }
}
