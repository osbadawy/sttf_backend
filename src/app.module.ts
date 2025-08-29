import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WhoopCycle, WhoopCycleScore, WhoopWorkout, WhoopWorkoutScore, WhoopWorkoutZoneDurations, WhoopRecovery, WhoopRecoveryScore, WhoopSleep, WhoopSleepScore, WhoopSleepStageSummary, WhoopSleepNeeded } from './db/whoop';

// Validate required environment variables
const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      autoLoadModels: true,
      synchronize: true, // ⚠️ only in dev
    }),
    SequelizeModule.forFeature([WhoopCycle, WhoopCycleScore, WhoopWorkout, WhoopWorkoutScore, WhoopWorkoutZoneDurations, WhoopRecovery, WhoopRecoveryScore, WhoopSleep, WhoopSleepScore, WhoopSleepStageSummary, WhoopSleepNeeded]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
