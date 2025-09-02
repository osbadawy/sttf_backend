import { Module } from '@nestjs/common';
import { ModelsModule } from '../database/models.module';
import { WhoopService } from './whoop.service';
import { WhoopController } from './whoop.controller';
import { PassportModule } from '@nestjs/passport';
import { WhoopStrategy } from './whoop.strategy';


@Module({
  imports: [ModelsModule, PassportModule.register({ session: false })],
  exports: [ModelsModule],
  providers: [WhoopService, WhoopStrategy],
  controllers: [WhoopController],
})
export class WhoopModule {}

