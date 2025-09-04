import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './controllers/user.controller';
import { TeamController } from './controllers/team.controller';

const ALL_MODELS = Array.from(new Set([...Object.values(Models)])) as any[];

@Module({
  imports: [SequelizeModule.forFeature(ALL_MODELS)],
  exports: [SequelizeModule],
  controllers: [UserController, TeamController],
})
export class UserModule {}
