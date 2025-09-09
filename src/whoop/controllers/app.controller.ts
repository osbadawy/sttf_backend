// whoop.controller.ts
import { Controller, UseGuards, Post, Body, Req, Get } from '@nestjs/common';
import type { Request } from 'express';
import { WhoopUserService, WhoopWorkoutService } from 'src/whoop/services';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { WhoopAppMultiDayRequest, WhoopAppSingleDayRequest } from 'src/whoop/dtos';


@Controller('whoop/app')
export class WhoopAppController {
  constructor(
    private readonly whoopWorkoutService: WhoopWorkoutService,
    private readonly whoopUserService: WhoopUserService,
  ) {}

  // @UseGuards(FirebaseAuthGuard)
  @Get("/day")
  async day(@Req() req: Request, @Body() body: WhoopAppSingleDayRequest) {
    return await this.whoopUserService.getDaySummary(body.user_id, body.day);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get("/workout")
  async workout(@Req() req: Request, @Body() body: WhoopAppMultiDayRequest) {
    return await this.whoopWorkoutService.getWorkouts(body.user_id, body.days);
  }
}
