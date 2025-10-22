import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { PlannedActivityController } from './planned_activity.controller';
import { PlannedActivityService } from './planned_activity.service';
import { User } from 'src/user/models';

@Module({
  imports: [SequelizeModule.forFeature([...Object.values(Models), User])],
  exports: [SequelizeModule],
  controllers: [PlannedActivityController],
  providers: [PlannedActivityService],
})
export class PlannedActivityModule {}
