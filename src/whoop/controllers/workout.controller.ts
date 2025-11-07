// whoop.controller.ts
import { Controller, UseGuards, Query, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WhoopWorkoutService } from 'src/whoop/services';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { WhoopWorkoutRequestQuery } from 'src/whoop/dtos/whoop_request.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { DbUser } from 'src/auth/db-user.decorator';
import { User } from 'src/user/models/user.model';
import { validatePlayerFirebaseId } from 'src/auth/auth.utils';

@ApiTags('Whoop Workout')
@ApiBearerAuth('firebase-auth')
@Controller('whoop/workout')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class WhoopWorkoutController {
  constructor(private readonly whoopWorkoutService: WhoopWorkoutService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get workouts',
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
    description: 'Forbidden - Players can only view their own workouts',
  })
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
  @ApiOperation({
    summary: 'Get workout by ID',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** All authenticated users can view workout details by ID',
  })
  @ApiParam({ name: 'id', description: 'Workout ID' })
  @ApiResponse({ status: 200, description: 'Workout retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  async getPlayerActivityById(@Param('id') id: string) {
    return this.whoopWorkoutService.getWorkoutById(id);
  }
}
