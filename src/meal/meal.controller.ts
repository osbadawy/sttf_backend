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
} from '@nestjs/common';
import { MealService } from './meal.service';
import {
  CreateMealBodyRequest,
  GetMealsQuery,
  UnassignMealBodyRequest,
  UpdateMealBodyRequest,
  CompleteMealRequest,
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
    return this.mealService.getMeals(query);
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
