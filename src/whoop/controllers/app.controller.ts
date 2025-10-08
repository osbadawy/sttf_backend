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

@Controller('whoop/app')
@UseGuards(FirebaseAuthGuard)
export class WhoopAppController {
  constructor(
    private readonly whoopWorkoutService: WhoopWorkoutService,
    private readonly whoopUserService: WhoopUserService,
    private readonly whoopCycleService: WhoopCycleService,
    private readonly whoopSleepService: WhoopSleepService,
    private readonly whoopRecoveryService: WhoopRecoveryService,
  ) {}

  @Get('/day')
  async day(@Query() query: WhoopAppSingleDayRequest) {
    return await this.whoopUserService.getDaySummary(
      query.firebase_id,
      query.day,
    );
  }

  @Get('/day/players')
  async dayAll(@Query() query: { day: Date }) {
    return await this.whoopUserService.getAllPlayersDaySummary(query.day);
  }

  @Get('/days')
  async days(@Query() query: WhoopAppMultiDayRequest) {
    return await this.whoopUserService.getMultiDaysSummary(
      query.firebase_id,
      query.days,
    );
  }

  @Get('/workouts')
  async workout(@Query() query: WhoopAppMultiDayRequest) {
    return await this.whoopWorkoutService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }

  @Get('/cycles')
  async cycle(@Query() query: WhoopAppMultiDayRequest) {
    return await this.whoopCycleService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }

  @Get('/sleeps')
  async sleep(@Query() query: WhoopAppMultiDayRequest) {
    return await this.whoopSleepService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }

  @Get('/recoveries')
  async recovery(@Query() query: WhoopAppMultiDayRequest) {
    return await this.whoopRecoveryService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }
}
