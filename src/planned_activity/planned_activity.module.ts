import { Module } from '@nestjs/common';
import { PlannedActivity } from './models/planned_activity.model';
import { PlannedActivityAssignment } from './models/planned_activity_assignment.model';
import { PlannedActivityItem } from './models/planned_activity_item.model';
import { PlannedActivityPerformance } from './models/planned_activity_performance.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { PlannedActivityController } from './planned_activity.controller';
import { PlannedActivityService } from './planned_activity.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PlannedActivity,
      PlannedActivityAssignment,
      PlannedActivityItem,
      PlannedActivityPerformance,
    ]),
  ],
  exports: [SequelizeModule],
  controllers: [PlannedActivityController],
  providers: [PlannedActivityService],
})
export class PlannedActivityModule {}
