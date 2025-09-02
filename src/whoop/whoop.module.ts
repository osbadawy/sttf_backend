import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';

const ALL_MODELS = Array.from(new Set([...Object.values(Models)])) as any[];

@Module({
  imports: [SequelizeModule.forFeature(ALL_MODELS)],
  exports: [SequelizeModule],
})
export class WhoopModule {}
