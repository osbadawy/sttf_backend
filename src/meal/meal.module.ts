import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'src/user/models';
import { UserModule } from 'src/user/user.module';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([...Object.values(Models), User]),
    UserModule,
  ],
  exports: [SequelizeModule],
  providers: [MealService],
  controllers: [MealController],
})
export class MealModule {}
