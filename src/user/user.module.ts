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

const ALL_MODELS = Array.from(new Set([...Object.values(Models)])) as any[];

@Module({
  imports: [SequelizeModule.forFeature(ALL_MODELS)],
  exports: [SequelizeModule],
  controllers: [
    UserController,
    TeamController,
    PlayerStatsController,
    BodyCompositionController,
    MealsController,
    PlayerSelfAssessmentController,
    CoachAssessmentController,
  ],
})
export class UserModule {}
