import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  WhoopCycle,
  WhoopCycleScore,
  WhoopWorkout,
  WhoopWorkoutScore,
  WhoopWorkoutZoneDurations,
  WhoopRecovery,
  WhoopRecoveryScore,
  WhoopSleep,
  WhoopSleepScore,
  WhoopSleepStageSummary,
  WhoopSleepNeeded,
} from './models';

@Module({
  imports: [
    SequelizeModule.forFeature([
      WhoopCycle,
      WhoopCycleScore,
      WhoopWorkout,
      WhoopWorkoutScore,
      WhoopWorkoutZoneDurations,
      WhoopRecovery,
      WhoopRecoveryScore,
      WhoopSleep,
      WhoopSleepScore,
      WhoopSleepStageSummary,
      WhoopSleepNeeded,
    ]),
  ],
})
export class WhoopModule {}
