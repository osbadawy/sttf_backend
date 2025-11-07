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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('Planned Activity')
@ApiBearerAuth('firebase-auth')
@Controller('planned-activity')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class PlannedActivityController {
  constructor(
    private readonly plannedActivityService: PlannedActivityService,
  ) {}

  //Coach creates a planned activity for selected players
  //If user is a player, they can only create activities for themselves
  @Post()
  @ApiOperation({
    summary: 'Create planned activity',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only create activities for themselves (users_assigned must contain only their own firebase_id)\n' +
      '- **Staff:** Can create activities for any players by specifying their firebase_ids in users_assigned',
  })
  @ApiResponse({
    status: 201,
    description: 'Planned activity created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Players can only create activities for themselves',
  })
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
  @ApiOperation({
    summary: 'Update planned activity',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only update activities assigned to themselves (users_assigned must contain only their own firebase_id)\n' +
      '- **Staff:** Can update activities for any players by specifying their firebase_ids in users_assigned',
  })
  @ApiResponse({
    status: 200,
    description: 'Planned activity updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Players can only update activities assigned to themselves',
  })
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
  @ApiOperation({
    summary: 'Unassign players from planned activity',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only unassign themselves from activities (users_assigned must contain only their own firebase_id)\n' +
      '- **Staff:** Can unassign any players from activities by specifying their firebase_ids in users_assigned',
  })
  @ApiResponse({
    status: 200,
    description: 'Players unassigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only unassign themselves',
  })
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
  @ApiOperation({
    summary: 'Get planned activities',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own activities (users_assigned must contain only their own firebase_id)\n' +
      '- **Staff:** Can view activities for any players by specifying their firebase_ids in users_assigned query parameter',
  })
  @ApiResponse({
    status: 200,
    description: 'Planned activities retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own activities',
  })
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
  @ApiOperation({
    summary: 'Get planned activity by ID',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** All authenticated users can view activity details by ID',
  })
  @ApiParam({ name: 'id', description: 'Planned activity ID' })
  @ApiResponse({
    status: 200,
    description: 'Planned activity retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Planned activity not found' })
  async getPlannedActivityById(@Param('id') id: string) {
    return this.plannedActivityService.getPlannedActivityById(id);
  }

  //Player completes a planned activity
  @Post('/player-self-assessment')
  @ApiOperation({
    summary: 'Complete planned activity',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** Users can mark a planned activity as completed with a self-assessment score',
  })
  @ApiResponse({
    status: 201,
    description: 'Planned activity completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
