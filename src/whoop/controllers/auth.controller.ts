// whoop.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import {
  WhoopOAuthGuard,
  WhoopCallbackGuard,
  ExtractFromUrlGuard,
} from 'src/whoop/guards';
import { WhoopCallbackRequest, AddWhoopAccessDto } from 'src/whoop/dtos';
import {
  WhoopCycleService,
  WhoopUserService,
  WhoopSleepService,
  WhoopRecoveryService,
  WhoopWorkoutService,
  WhoopAccessService,
} from 'src/whoop/services';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('Whoop Auth')
@Controller('whoop/auth')
export class WhoopAuthController {
  constructor(
    private readonly whoopUserService: WhoopUserService,
    private readonly whoopCycleService: WhoopCycleService,
    private readonly whoopSleepService: WhoopSleepService,
    private readonly whoopRecoveryService: WhoopRecoveryService,
    private readonly whoopWorkoutService: WhoopWorkoutService,
    private readonly whoopAccessService: WhoopAccessService,
  ) {}

  @Get('/')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Get Whoop user',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** Users can only retrieve their own Whoop user information',
  })
  @ApiResponse({
    status: 200,
    description: 'Whoop user retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Whoop user not found' })
  async getWhoopUser(@Req() req: Request & { user: { uid: string } }) {
    return await this.whoopUserService.getWhoopUser(req.user.uid);
  }

  // Only admins can add whoop access
  @Roles('admin')
  @Post('/add-access')
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Add Whoop access (Admin only)',
    description:
      '**Roles:** admin\n\n' +
      '**Access:** Only admins can add Whoop access credentials (client_id and client_secret)\n\n' +
      '**Restrictions:** Players, coaches, and nutritionists cannot add Whoop access',
  })
  @ApiResponse({ status: 201, description: 'Whoop access added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async addWhoopAccess(@Body() body: AddWhoopAccessDto) {
    console.log(body);
    return await this.whoopAccessService.addAccess(body);
  }

  // Step 1: kick off OAuth
  @Get('/start')
  @UseGuards(ExtractFromUrlGuard, FirebaseAuthGuard, WhoopOAuthGuard)
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Start Whoop OAuth flow',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** Initiates the Whoop OAuth authentication process to connect a Whoop account',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Whoop OAuth' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  whoopOAuthStart() {
    // Guard redirects to WHOOP automatically
    return { ok: true };
  }

  // Step 2: WHOOP redirects back here with authorization code
  @Get('/callback')
  @UseGuards(WhoopCallbackGuard)
  @ApiOperation({
    summary: 'Whoop OAuth callback',
    description:
      '**Roles:** Public endpoint (no authentication required)\n\n' +
      '**Access:** Callback endpoint for Whoop OAuth flow. Automatically processes the OAuth response and creates/updates Whoop user data',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects after successful authentication',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing redirect URL',
  })
  async whoopCallback(@Req() req: WhoopCallbackRequest, @Res() res: Response) {
    if (!req.redirect_url) {
      throw new BadRequestException('Redirect URL is missing');
    }

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
        whoop_access_id: req.whoopTokens.whoop_access_id,
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
    console.log('Redirecting to:', req.redirect_url);
    return res.redirect(req.redirect_url);
  }
}
