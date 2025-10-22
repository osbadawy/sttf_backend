import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { User, DailyPoints, PlayerStats } from 'src/user/models';
import { WhoopUser } from 'src/whoop/models';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { DailyPointsService } from 'src/user/services/daily_points.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ...Object.values(Models),
      User,
      DailyPoints,
      PlayerStats,
      WhoopUser,
    ]),
  ],
  exports: [SequelizeModule],
  providers: [MealService, DailyPointsService],
  controllers: [MealController],
})
export class MealModule {}
