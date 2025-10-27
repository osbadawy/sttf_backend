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
  InternalServerErrorException,
} from '@nestjs/common';
import { MealService } from './meal.service';
import {
  CreateMealBodyRequest,
  GetMealsQuery,
  UnassignMealBodyRequest,
  UpdateMealBodyRequest,
  CompleteMealRequest,
  CreateInstantMealBodyRequest,
} from './dtos/request.dto';
import { UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';

@Controller('meal')
@UseGuards(FirebaseAuthGuard)
export class MealController {
  constructor(private readonly mealService: MealService) {}

  //Coach creates a meal for selected players
  @Post()
  async createMeal(
    @Body() body: CreateMealBodyRequest,
    @Req() req: Request & { user: { uid: string } },
  ) {
    return this.mealService.createMeal(body, req.user.uid);
  }

  //Coach updates a  meal
  @Patch()
  async updateMeal(
    @Body() body: UpdateMealBodyRequest,
    @Req() req: Request & { user: { uid: string } },
  ) {
    return this.mealService.updateMeal(body, req.user.uid);
  }

  @Delete()
  async unassignPlayersFromMeal(@Body() body: UnassignMealBodyRequest) {
    return this.mealService.unassignPlayersFromMeal(body);
  }

  //Get meal based on players and day
  @Get()
  async getMeals(@Query() query: GetMealsQuery) {
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
    });
  }

  //Gets a meal by id
  @Get('/:id')
  async getMealById(@Param('id') id: string) {
    return this.mealService.getMealById(id);
  }

  //Player completes a meal
  @Post('/complete')
  async completeMeal(
    @Body() body: CompleteMealRequest,
    @Req() req: Request & { user: { uid: string } },
  ) {
    return this.mealService.completeMeal(body, req.user.uid);
  }
}
