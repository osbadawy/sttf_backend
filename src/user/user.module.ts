import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './controllers/user.controller';
import { TeamController } from './controllers/team.controller';
import { PlayerStatsController } from './controllers/player_stats.controller';
import { BodyCompositionController } from './controllers/body_composition.controller';
import { MealsController } from './controllers/meal.controller';
import { PlayerSelfAssessmentController } from './controllers/player_self_assessment.controller';
import { CoachAssessmentController } from './controllers/coach_assessment.controller';
import { PlayerActivityController } from './controllers/player_activity.controller';
import { PlayerActivityService } from './services/player_activity.service';
import {
  WhoopWorkout,
  WhoopWorkoutScore,
  WhoopWorkoutZoneDurations,
} from 'src/whoop/models';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ...Object.values(Models),
      WhoopWorkout,
      WhoopWorkoutScore,
      WhoopWorkoutZoneDurations,
    ]),
  ],
  exports: [SequelizeModule],
  controllers: [
    UserController,
    TeamController,
    PlayerStatsController,
    BodyCompositionController,
    MealsController,
    PlayerSelfAssessmentController,
    CoachAssessmentController,
    PlayerActivityController,
  ],
  providers: [PlayerActivityService],
})
export class UserModule {}
