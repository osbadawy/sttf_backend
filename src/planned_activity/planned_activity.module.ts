import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { PlannedActivityController } from './planned_activity.controller';
import { PlannedActivityService } from './planned_activity.service';
import { User, DailyPoints, PlayerStats } from 'src/user/models';
import { WhoopUser } from 'src/whoop/models';
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
  exports: [SequelizeModule, PlannedActivityService],
  controllers: [PlannedActivityController],
  providers: [PlannedActivityService, DailyPointsService],
})
export class PlannedActivityModule {}
