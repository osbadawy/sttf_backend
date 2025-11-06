import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './controllers/user.controller';
import { BodyCompositionController } from './controllers/body_composition.controller';
import { PlayerSelfAssessmentController } from './controllers/player_self_assessment.controller';
import { CoachAssessmentController } from './controllers/coach_assessment.controller';
import { PlayerSelfAssessmentService } from './services/player_self_assessment.service';
import { DailyPointsService } from './services/daily_points.service';
import { UserService } from './services/user.service';
import {
  WhoopWorkout,
  WhoopWorkoutScore,
  WhoopWorkoutZoneDurations,
  WhoopUser,
} from 'src/whoop/models';
import { MealService } from 'src/meal/meal.service';
import { PlannedActivityService } from 'src/planned_activity/planned_activity.service';
import * as MealModels from 'src/meal/models';
import * as PlannedActivityModels from 'src/planned_activity/models';
import { BodyCompositionService } from './services/body_composition.service';
import { CoachAssessmentService } from './services/coach_assessment.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ...Object.values(Models),
      ...Object.values(MealModels),
      ...Object.values(PlannedActivityModels),
      WhoopWorkout,
      WhoopWorkoutScore,
      WhoopWorkoutZoneDurations,
      WhoopUser,
    ]),
  ],
  exports: [SequelizeModule, DailyPointsService],
  controllers: [
    UserController,
    BodyCompositionController,
    PlayerSelfAssessmentController,
    CoachAssessmentController,
  ],
  providers: [
    PlayerSelfAssessmentService,
    DailyPointsService,
    UserService,
    PlannedActivityService,
    MealService,
    BodyCompositionService,
    CoachAssessmentService,
  ],
})
export class UserModule {}
