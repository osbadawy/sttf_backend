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
import { MealService } from './meal.service';
import {
  CreateMealBodyRequest,
  GetMealsQuery,
  GetMealsByDateRangeQuery,
  UnassignMealBodyRequest,
  UpdateMealBodyRequest,
  CompleteMealRequest,
} from './dtos/request.dto';
import { UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { DbUser } from 'src/auth/db-user.decorator';
import {
  validatePlayerSelfAccess,
  validatePlayerFirebaseId,
} from 'src/auth/auth.utils';
import { User } from 'src/user/models/user.model';

@ApiTags('Meal')
@ApiBearerAuth('firebase-auth')
@Controller('meal')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class MealController {
  constructor(private readonly mealService: MealService) {}

  //Coach creates a meal for selected players
  //If user is a player, they can only create meals for themselves
  @Post()
  @ApiOperation({
    summary: 'Create meal',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only create meals for themselves (users_assigned must contain only their own firebase_id)\n' +
      '- **Staff:** Can create meals for any players by specifying their firebase_ids in users_assigned',
  })
  @ApiResponse({ status: 201, description: 'Meal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only create meals for themselves',
  })
  async createMeal(@Body() body: CreateMealBodyRequest, @DbUser() user: User) {
    validatePlayerSelfAccess(
      user,
      body.users_assigned,
      'Players can only create meals for themselves',
    );

    return this.mealService.createMeal(body, user.firebase_id);
  }

  //Coach updates a meal
  //If user is a player, they can only update meals assigned to themselves
  @Patch()
  @ApiOperation({
    summary: 'Update meal',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only update meals assigned to themselves (users_assigned must contain only their own firebase_id)\n' +
      '- **Staff:** Can update meals for any players by specifying their firebase_ids in users_assigned',
  })
  @ApiResponse({ status: 200, description: 'Meal updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Players can only update meals assigned to themselves',
  })
  async updateMeal(@Body() body: UpdateMealBodyRequest, @DbUser() user: User) {
    validatePlayerSelfAccess(
      user,
      body.users_assigned,
      'Players can only update meals for themselves',
    );

    return this.mealService.updateMeal(body, user.firebase_id);
  }

  @Delete()
  @ApiOperation({
    summary: 'Unassign players from meal',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only unassign themselves from meals (users_assigned must contain only their own firebase_id)\n' +
      '- **Staff:** Can unassign any players from meals by specifying their firebase_ids in users_assigned',
  })
  @ApiResponse({ status: 200, description: 'Players unassigned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only unassign themselves',
  })
  async unassignPlayersFromMeal(
    @Body() body: UnassignMealBodyRequest,
    @DbUser() user: User,
  ) {
    validatePlayerSelfAccess(
      user,
      body.users_assigned,
      'Players can only unassign themselves from meals',
    );

    return this.mealService.unassignPlayersFromMeal(body);
  }

  //Get meal based on players and day
  //If user is a player, they can only view their own meals
  @Get()
  @ApiOperation({
    summary: 'Get meals',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own meals (users_assigned must contain only their own firebase_id)\n' +
      '- **Staff:** Can view meals for any players by specifying their firebase_ids in users_assigned query parameter',
  })
  @ApiResponse({ status: 200, description: 'Meals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own meals',
  })
  async getMeals(@Query() query: GetMealsQuery, @DbUser() user: User) {
    validatePlayerSelfAccess(
      user,
      query.users_assigned,
      'Players can only view their own meals',
    );

    const startDate = new Date(query.day);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(query.day);
    endDate.setHours(23, 59, 59, 999);

    const dayOfWeek = startDate
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toLowerCase();

    return this.mealService.getMeals({
      startDate,
      endDate,
      dayOfWeek,
      users_assigned: query.users_assigned,
      onlyMatchSelectedPlayers: query.onlyMatchSelectedPlayers,
    });
  }

  @Get('/completed')
  @ApiOperation({
    summary: 'Get completed meals by date range',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own completed meals (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view completed meals for any player by specifying firebase_id',
  })
  @ApiResponse({
    status: 200,
    description: 'Completed meals retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own completed meals',
  })
  async getCompletedMealsByDateRange(
    @Query() query: GetMealsByDateRangeQuery,
    @DbUser() user: User,
  ) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own completed meals',
    );

    return this.mealService.getCompletedMealsByDateRange(query);
  }

  //Gets a meal by id
  @Get('/:id')
  @ApiOperation({
    summary: 'Get meal by ID',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** All authenticated users can view meal details by ID',
  })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({ status: 200, description: 'Meal retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  async getMealById(@Param('id') id: string) {
    return this.mealService.getMealById(id);
  }

  //Player completes a meal
  @Post('/complete')
  @ApiOperation({
    summary: 'Complete meal',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** Users can mark a meal as completed with optional image upload',
  })
  @ApiResponse({ status: 201, description: 'Meal completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeMeal(@Body() body: CompleteMealRequest, @DbUser() user: User) {
    return this.mealService.completeMeal(body, user.firebase_id);
  }
}
