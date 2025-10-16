// whoop.controller.ts
import { Controller, UseGuards, Query, Get, Param } from '@nestjs/common';
import { WhoopWorkoutService } from 'src/whoop/services';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { WhoopWorkoutRequestQuery } from 'src/whoop/dtos/whoop_request.dto';

@Controller('whoop/workout')
@UseGuards(FirebaseAuthGuard)
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
}
