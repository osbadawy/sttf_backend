import { Inject, Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { WhoopWorkout } from 'src/whoop/models/workout.model';
import { WhoopWorkoutScore } from 'src/whoop/models/workout_score.model';
import { WhoopWorkoutZoneDurations } from 'src/whoop/models/workout_zone_durations.model';
import { CryptoUtil } from 'src/utils';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class WhoopWebhookService {
  constructor(
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @InjectModel(WhoopWorkout)
    private readonly whoopWorkoutModel: typeof WhoopWorkout,
    @InjectModel(WhoopWorkoutScore)
    private readonly whoopWorkoutScoreModel: typeof WhoopWorkoutScore,
    @InjectModel(WhoopWorkoutZoneDurations)
    private readonly whoopWorkoutZoneDurationsModel: typeof WhoopWorkoutZoneDurations,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly httpService: HttpService,
  ) {}

  async handleWebhook(webhook: any) {
    console.log(webhook);
  }
}
