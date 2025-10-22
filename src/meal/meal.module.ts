import { Module } from '@nestjs/common';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'src/user/models';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    SequelizeModule.forFeature([...Object.values(Models), User]),
    UserModule,
  ],
  exports: [SequelizeModule],
})
export class MealModule {}
