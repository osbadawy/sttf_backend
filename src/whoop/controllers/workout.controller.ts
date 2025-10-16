// whoop.controller.ts
import {
  Controller,
  UseGuards,
  Post,
  Body,
  Req,
  Query,
  Get,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { WhoopWebhookService, WhoopWorkoutService } from 'src/whoop/services';
import { WhoopWebhookAccessTokenGuard } from 'src/whoop/guards';
import { WhoopAccessTokens } from 'src/whoop/dtos/whoop_user.dto';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { WhoopWorkoutRequestQuery } from 'src/whoop/dtos/whoop_request.dto';

interface RequestWithWhoopAccess extends Request {
  whoop_access: WhoopAccessTokens;
}

@Controller('whoop/workout')
// @UseGuards(FirebaseAuthGuard)
export class WhoopWorkoutController {
  constructor(private readonly whoopWorkoutService: WhoopWorkoutService) {}

  @Get('/')
  async getWorkouts(@Query() query: WhoopWorkoutRequestQuery) {
    return this.whoopWorkoutService.getWorkouts(
      query.firebase_id,
      query.start_date,
      query.end_date,
    );
  }

  @Get('/:id')
  async getPlayerActivityById(@Param('id') id: string) {
    return this.whoopWorkoutService.getWorkoutById(id);
  }

  //   @Post('/')
  //   async createWorkout(@Body() body: CreateWorkoutRequest) {
  //     return this.whoopWorkoutService.createWorkout(body);
  //   }

  //   @Post('self-assessment/')
  //   async createWorkout(@Body() body: CreateWorkoutRequest) {
  //     return this.whoopWorkoutService.createWorkout(body);
  //   }
}
