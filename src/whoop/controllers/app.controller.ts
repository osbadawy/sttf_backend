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
export class WhoopAppController {
  constructor(
    private readonly whoopWorkoutService: WhoopWorkoutService,
    private readonly whoopUserService: WhoopUserService,
    private readonly whoopCycleService: WhoopCycleService,
    private readonly whoopSleepService: WhoopSleepService,
    private readonly whoopRecoveryService: WhoopRecoveryService,
  ) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('/day')
  async day(@Query() query: WhoopAppSingleDayRequest) {
    return await this.whoopUserService.getDaySummary(query.firebase_id, query.day);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('/workouts')
  async workout(@Query() query: WhoopAppMultiDayRequest) {
    return await this.whoopWorkoutService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('/cycles')
  async cycle(@Query() query: WhoopAppMultiDayRequest) {
    return await this.whoopCycleService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('/sleeps')
  async sleep(@Query() query: WhoopAppMultiDayRequest) {
    return await this.whoopSleepService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('/recoveries')
  async recovery(@Query() query: WhoopAppMultiDayRequest) {
    return await this.whoopRecoveryService.getMultiDayData(
      query.firebase_id,
      query.days,
    );
  }
}
