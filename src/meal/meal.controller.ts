import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  Param,
  Query,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
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
import { Roles } from 'src/auth/roles.decorator';
import { User } from 'src/user/models/user.model';

@Controller('meal')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class MealController {
  constructor(private readonly mealService: MealService) {}

  /**
   * Validates that players can only access their own data
   * @throws ForbiddenException if player tries to access other users' data
   */
  private validatePlayerSelfAccess(
    user: User,
    users_assigned: string[],
    errorMessage: string,
  ): void {
    if (user.access === 'player') {
      if (
        users_assigned.length !== 1 ||
        users_assigned[0] !== user.firebase_id
      ) {
        throw new ForbiddenException(errorMessage);
      }
    }
  }

  /**
   * Validates that players can only access their own firebase_id
   * @throws ForbiddenException if player tries to access other user's data
   */
  private validatePlayerFirebaseId(
    user: User,
    firebase_id: string,
    errorMessage: string,
  ): void {
    if (user.access === 'player' && firebase_id !== user.firebase_id) {
      throw new ForbiddenException(errorMessage);
    }
  }

  //Coach creates a meal for selected players
  //If user is a player, they can only create meals for themselves
  @Post()
  async createMeal(@Body() body: CreateMealBodyRequest, @DbUser() user: User) {
    this.validatePlayerSelfAccess(
      user,
      body.users_assigned,
      'Players can only create meals for themselves',
    );

    return this.mealService.createMeal(body, user.firebase_id);
  }

  //Coach updates a meal
  //If user is a player, they can only update meals assigned to themselves
  @Patch()
  async updateMeal(@Body() body: UpdateMealBodyRequest, @DbUser() user: User) {
    this.validatePlayerSelfAccess(
      user,
      body.users_assigned,
      'Players can only update meals for themselves',
    );

    return this.mealService.updateMeal(body, user.firebase_id);
  }

  @Delete()
  async unassignPlayersFromMeal(
    @Body() body: UnassignMealBodyRequest,
    @DbUser() user: User,
  ) {
    this.validatePlayerSelfAccess(
      user,
      body.users_assigned,
      'Players can only unassign themselves from meals',
    );

    return this.mealService.unassignPlayersFromMeal(body);
  }

  //Get meal based on players and day
  //If user is a player, they can only view their own meals
  @Get()
  async getMeals(@Query() query: GetMealsQuery, @DbUser() user: User) {
    console.log("I get here")
    this.validatePlayerSelfAccess(
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
  async getCompletedMealsByDateRange(
    @Query() query: GetMealsByDateRangeQuery,
    @DbUser() user: User,
  ) {
    this.validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own completed meals',
    );

    return this.mealService.getCompletedMealsByDateRange(query);
  }

  //Gets a meal by id
  @Get('/:id')
  async getMealById(@Param('id') id: string) {
    return this.mealService.getMealById(id);
  }

  //Player completes a meal
  @Post('/complete')
  async completeMeal(@Body() body: CompleteMealRequest, @DbUser() user: User) {
    return this.mealService.completeMeal(body, user.firebase_id);
  }
}
