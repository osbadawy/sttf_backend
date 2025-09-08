import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './controllers/user.controller';
import { TeamController } from './controllers/team.controller';
import { PlayerStatsController } from './controllers/player_stats.controller';
import { BodyCompositionController } from './controllers/body_composition.controller';

const ALL_MODELS = Array.from(new Set([...Object.values(Models)])) as any[];

@Module({
  imports: [SequelizeModule.forFeature(ALL_MODELS)],
  exports: [SequelizeModule],
  controllers: [
    UserController,
    TeamController,
    PlayerStatsController,
    BodyCompositionController,
  ],
})
export class UserModule {}
