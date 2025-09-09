// whoop.controller.ts
import { Controller, UseGuards, Body, Get } from '@nestjs/common';
import type { Request } from 'express';
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
  async day(@Body() body: WhoopAppSingleDayRequest) {
    return await this.whoopUserService.getDaySummary(body.user_id, body.day);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('/workouts')
  async workout(@Body() body: WhoopAppMultiDayRequest) {
    return await this.whoopWorkoutService.getMultiDayData(
      body.user_id,
      body.days,
    );
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('/cycles')
  async cycle(@Body() body: WhoopAppMultiDayRequest) {
    return await this.whoopCycleService.getMultiDayData(
      body.user_id,
      body.days,
    );
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('/sleeps')
  async sleep(@Body() body: WhoopAppMultiDayRequest) {
    return await this.whoopSleepService.getMultiDayData(
      body.user_id,
      body.days,
    );
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('/recoveries')
  async recovery(@Body() body: WhoopAppMultiDayRequest) {
    return await this.whoopRecoveryService.getMultiDayData(
      body.user_id,
      body.days,
    );
  }
}
