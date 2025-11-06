// whoop.controller.ts
import { Controller, UseGuards, Body, Get, Query } from '@nestjs/common';
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
  async dayAll(@Query() query: { day: Date }) {
    return await this.whoopUserService.getAllPlayersDaySummary(query.day);
  }

  @Get('/days')
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
