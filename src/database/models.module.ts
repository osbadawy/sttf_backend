import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import * as UserAuthModels from '../user_auth/models';
import * as WhoopModels from '../whoop/models';

const ALL_MODELS = Array.from(
  new Set([
    ...Object.values(UserAuthModels),
    ...Object.values(WhoopModels),
  ])
) as any[];

@Module({
  imports: [SequelizeModule.forFeature(ALL_MODELS)],
  exports: [SequelizeModule],
})
export class ModelsModule {}
