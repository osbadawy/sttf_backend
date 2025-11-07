import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { playerWithPlansResponse } from '../dtos/response.dtos';
import { UserService } from '../services/user.service';

import {
  SignUpBodyRequest,
  GetPlayerDayPlanQuery,
  PatchUserBodyRequest,
} from '../dtos/request.dtos';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { IgnoreRoles } from 'src/auth/roles.decorator';
import { DbUser } from 'src/auth/db-user.decorator';
import { User } from '../models/user.model';
import { validatePlayerFirebaseId } from 'src/auth/auth.utils';

@ApiTags('User')
@ApiBearerAuth('firebase-auth')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get user by Firebase UID',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** Users can only retrieve their own information',
  })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByPk(@Req() req: Request & { user: { uid: string } }) {
    return await this.userService.getUser(req.user.uid);
  }

  // Only staff can get all players
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  @IgnoreRoles('player')
  @Get('/players')
  @ApiOperation({
    summary: 'Get all players (Staff only)',
    description:
      '**Roles:** admin, coach, nutritionist\n\n' +
      '**Access:** Staff members can retrieve information about all players\n\n' +
      '**Restrictions:** Players cannot access this endpoint',
  })
  @ApiResponse({ status: 200, description: 'Players retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players cannot access',
  })
  async getPlayers() {
    return await this.userService.getPlayers();
  }

  @Patch()
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  @ApiOperation({
    summary: 'Update user by Firebase UID',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** Users can only update their own information',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async patchUserByPk(
    @Body() body: PatchUserBodyRequest,
    @Req() req: Request & { user: { uid: string } },
  ) {
    return await this.userService.patchUserByPk(body, req.user.uid);
  }

  // Only staff can get all players week plans
  @IgnoreRoles('player')
  @Get('/players/week')
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get all players week plans (Staff only)',
    description:
      '**Roles:** admin, coach, nutritionist\n\n' +
      '**Access:** Staff members can retrieve week plans for all players\n\n' +
      '**Restrictions:** Players cannot access this endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Players week plans retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players cannot access',
  })
  async getPlayersWeekPlans(): Promise<playerWithPlansResponse> {
    const data = await this.userService.getPlayersWeekPlans();
    return { ok: true, data: data };
  }

  @Get('/player/day')
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get player day plans',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own day plans (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view day plans for any player by specifying firebase_id',
  })
  @ApiResponse({ status: 200, description: 'Day plans retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own day plans',
  })
  async getPlayerDayPlans(
    @Query() query: GetPlayerDayPlanQuery,
    @DbUser() user: User,
  ) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own day plans',
    );

    return await this.userService.getPlayerDayPlans(query);
  }

  @Post('signup')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({
    summary: 'Sign up a new user',
    description:
      '**Roles:** Any authenticated Firebase user (not yet registered in system)\n\n' +
      '**Access:** Creates a new user account with specified role (player, coach, nutritionist, admin)',
  })
  @ApiResponse({ status: 201, description: 'User signed up successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signUp(
    @Body() body: SignUpBodyRequest,
    @Req() req: Request & { user: { uid: string; email: string } },
  ) {
    return await this.userService.signUp(
      req.user.uid,
      req.user.email,
      body.access,
    );
  }
}
