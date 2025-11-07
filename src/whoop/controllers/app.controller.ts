// whoop.controller.ts
import { Controller, UseGuards, Body, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  WhoopUserService,
  WhoopWorkoutService,
  WhoopCycleService,
  WhoopSleepService,
  WhoopRecoveryService,
} from 'src/whoop/services';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import {
  WhoopAppMultiDayRequest,
  WhoopAppSingleDayRequest,
} from 'src/whoop/dtos';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { DbUser } from 'src/auth/db-user.decorator';
import { User } from 'src/user/models/user.model';
import { validatePlayerFirebaseId } from 'src/auth/auth.utils';
import { IgnoreRoles } from 'src/auth/roles.decorator';

@ApiTags('Whoop App')
@ApiBearerAuth('firebase-auth')
@Controller('whoop/app')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class WhoopAppController {
  constructor(
    private readonly whoopWorkoutService: WhoopWorkoutService,
    private readonly whoopUserService: WhoopUserService,
    private readonly whoopCycleService: WhoopCycleService,
    private readonly whoopSleepService: WhoopSleepService,
    private readonly whoopRecoveryService: WhoopRecoveryService,
  ) {}

  @Get('/day')
  @ApiOperation({
    summary: 'Get day summary',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own day summary (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view day summary for any player by specifying firebase_id',
  })
  @ApiResponse({
    status: 200,
    description: 'Day summary retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own data',
  })
  async day(@Query() query: WhoopAppSingleDayRequest, @DbUser() user: User) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own day summary',
    );

    return await this.whoopUserService.getDaySummary(
      query.firebase_id,
      query.day,
    );
  }

  // Only staff can view all players day summaries
  @IgnoreRoles('player')
  @Get('/day/players')
  @ApiOperation({
    summary: 'Get all players day summaries (Staff only)',
    description:
      '**Roles:** admin, coach, nutritionist\n\n' +
      '**Access:** Staff members can view day summaries for all players on a specific day\n\n' +
      '**Restrictions:** Players cannot access this endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Day summaries retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players cannot access',
  })
  async dayAll(@Query() query: { day: Date }) {
    return await this.whoopUserService.getAllPlayersDaySummary(query.day);
  }

  @Get('/days')
  @ApiOperation({
    summary: 'Get multi-day summary',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own multi-day summaries (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view multi-day summaries for any player by specifying firebase_id',
  })
  @ApiResponse({
    status: 200,
    description: 'Multi-day summary retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own data',
  })
  async days(@Query() query: WhoopAppMultiDayRequest, @DbUser() user: User) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own day summaries',
    );

    return await this.whoopUserService.getMultiDaysSummary(
      query.firebase_id,
      query.days,
    );
  }

  @Get('/workouts')
  @ApiOperation({
    summary: 'Get multi-day workouts',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own workouts (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view workouts for any player by specifying firebase_id',
  })
  @ApiResponse({ status: 200, description: 'Workouts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own data',
  })
  async workout(@Query() query: WhoopAppMultiDayRequest, @DbUser() user: User) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own workouts',
    );

    return await this.whoopWorkoutService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }

  @Get('/cycles')
  @ApiOperation({
    summary: 'Get multi-day cycles',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own cycles (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view cycles for any player by specifying firebase_id',
  })
  @ApiResponse({ status: 200, description: 'Cycles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own data',
  })
  async cycle(@Query() query: WhoopAppMultiDayRequest, @DbUser() user: User) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own cycles',
    );

    return await this.whoopCycleService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }

  @Get('/sleeps')
  @ApiOperation({
    summary: 'Get multi-day sleeps',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own sleep data (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view sleep data for any player by specifying firebase_id',
  })
  @ApiResponse({ status: 200, description: 'Sleeps retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own data',
  })
  async sleep(@Query() query: WhoopAppMultiDayRequest, @DbUser() user: User) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own sleeps',
    );

    return await this.whoopSleepService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }

  @Get('/recoveries')
  @ApiOperation({
    summary: 'Get multi-day recoveries',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own recovery data (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view recovery data for any player by specifying firebase_id',
  })
  @ApiResponse({
    status: 200,
    description: 'Recoveries retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own data',
  })
  async recovery(
    @Query() query: WhoopAppMultiDayRequest,
    @DbUser() user: User,
  ) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own recoveries',
    );

    return await this.whoopRecoveryService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }
}
