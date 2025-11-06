import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Delete,
} from '@nestjs/common';
import { PlannedActivityService } from './planned_activity.service';
import {
  CompletePlannedActivityRequest,
  CreatePlannedActivityBodyRequest,
  GetPlannedActivitiesQuery,
  UnassignPlannedActivityBodyRequest,
  UpdatePlannedActivityBodyRequest,
} from './dtos/request.dto';
import { UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { DbUser } from 'src/auth/db-user.decorator';
import { validatePlayerSelfAccess } from 'src/auth/auth.utils';
import { User } from 'src/user/models/user.model';

@Controller('planned-activity')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class PlannedActivityController {
  constructor(
    private readonly plannedActivityService: PlannedActivityService,
  ) {}

  //Coach creates a planned activity for selected players
  //If user is a player, they can only create activities for themselves
  @Post()
  async createPlannedActivity(
    @Body() body: CreatePlannedActivityBodyRequest,
    @DbUser() user: User,
  ) {
    validatePlayerSelfAccess(
      user,
      body.users_assigned,
      'Players can only create activities for themselves',
    );

    return this.plannedActivityService.createPlannedActivity(
      body,
      user.firebase_id,
    );
  }

  //Coach updates a planned activity
  //If user is a player, they can only update activities assigned to themselves
  @Patch()
  async updatePlannedActivity(
    @Body() body: UpdatePlannedActivityBodyRequest,
    @DbUser() user: User,
  ) {
    validatePlayerSelfAccess(
      user,
      body.users_assigned,
      'Players can only update activities for themselves',
    );

    return this.plannedActivityService.updatePlannedActivity(
      body,
      user.firebase_id,
    );
  }

  @Delete()
  async unassignPlayersFromPlannedActivity(
    @Body() body: UnassignPlannedActivityBodyRequest,
    @DbUser() user: User,
  ) {
    validatePlayerSelfAccess(
      user,
      body.users_assigned,
      'Players can only unassign themselves from activities',
    );

    return this.plannedActivityService.unassignPlayersFromPlannedActivity(body);
  }

  //Get planned activities based on players and day
  //If user is a player, they can only view their own activities
  @Get()
  async getPlannedActivities(
    @Query() query: GetPlannedActivitiesQuery,
    @DbUser() user: User,
  ) {
    validatePlayerSelfAccess(
      user,
      query.users_assigned,
      'Players can only view their own activities',
    );

    const startDate = new Date(query.day);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(query.day);
    endDate.setHours(23, 59, 59, 999);

    const dayOfWeek = startDate
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toLowerCase();

    return this.plannedActivityService.getPlannedActivities({
      startDate,
      endDate,
      dayOfWeek,
      users_assigned: query.users_assigned,
    });
  }

  //Gets a planned activity by id
  @Get('/:id')
  async getPlannedActivityById(@Param('id') id: string) {
    return this.plannedActivityService.getPlannedActivityById(id);
  }

  //Player completes a planned activity
  @Post('/player-self-assessment')
  async completePlannedActivity(
    @Body() body: CompletePlannedActivityRequest,
    @DbUser() user: User,
  ) {
    return this.plannedActivityService.completePlannedActivity(
      body,
      user.firebase_id,
    );
  }
}
