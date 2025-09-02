import { Module } from '@nestjs/common';
import { ModelsModule } from '../database/models.module';

@Module({
  imports: [ModelsModule],
  exports: [ModelsModule],
})
export class WhoopModule {}

