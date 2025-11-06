// whoop.controller.ts
import { Controller, UseGuards, Query, Get, Param } from '@nestjs/common';
import { WhoopWorkoutService } from 'src/whoop/services';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { WhoopWorkoutRequestQuery } from 'src/whoop/dtos/whoop_request.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { DbUser } from 'src/auth/db-user.decorator';
import { User } from 'src/user/models/user.model';
import { validatePlayerFirebaseId } from 'src/auth/auth.utils';

@Controller('whoop/workout')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class WhoopWorkoutController {
  constructor(private readonly whoopWorkoutService: WhoopWorkoutService) {}

  @Get('/')
  async getWorkouts(
    @Query() query: WhoopWorkoutRequestQuery,
    @DbUser() user: User,
  ) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own workouts',
    );

    const { workouts, hasWorkoutsBefore, hasWorkoutsAfter } =
      await this.whoopWorkoutService.getWorkouts(
        query.firebase_id,
        query.start_date,
        query.end_date,
      );
    return {
      workouts,
      hasWorkoutsBefore,
      hasWorkoutsAfter,
    };
  }

  @Get('/:id')
  async getPlayerActivityById(@Param('id') id: string) {
    return this.whoopWorkoutService.getWorkoutById(id);
  }
}
