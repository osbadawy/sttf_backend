import { Inject, Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { WhoopWorkout } from 'src/whoop/models/workout.model';
import { WhoopWorkoutScore } from 'src/whoop/models/workout_score.model';
import { WhoopWorkoutZoneDurations } from 'src/whoop/models/workout_zone_durations.model';
import { CryptoUtil } from 'src/utils';
import { HttpService } from '@nestjs/axios';
import { WhoopCycleService } from './cycle.service';
import { WhoopSleepService } from './sleep.service';
import { WhoopWorkoutService } from './workout.service';
import { WhoopRecoveryService } from './recovery.service';


interface Webhook {
  id: string; 
  user_id: number;
  type: string;
  trace_id: string | number;
}

enum WebhookDomain {
  CYCLE = 'cycle',
  SLEEP = 'sleep',
  WORKOUT = 'workout',
  RECOVERY = 'recovery',
}

enum WebhookProcess {
  CREATE = 'create',
  UPDATE = 'update',
}


@Injectable()
export class WhoopWebhookService {
  constructor(
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
    @Inject(HttpService) private readonly httpService: HttpService,
    @Inject(WhoopCycleService) private readonly whoopCycleService: WhoopCycleService,
    @Inject(WhoopSleepService) private readonly whoopSleepService: WhoopSleepService,
    @Inject(WhoopWorkoutService) private readonly whoopWorkoutService: WhoopWorkoutService,
    @Inject(WhoopRecoveryService) private readonly whoopRecoveryService: WhoopRecoveryService,
  ) {}

  async handleWebhook(webhook: Webhook, access_token: string) {
    const [domain, process] = webhook.type.split('.') as [WebhookDomain, WebhookProcess];
    console.log("Domain:", domain);
    console.log("Access Token:", access_token);

    try{
      switch (domain) {
        case WebhookDomain.CYCLE:
          console.log("Cycle")
          const _cd = await this.whoopCycleService.getSingleCycleFromWhoopApi(access_token, webhook.id);
          this.whoopCycleService.saveCyclesToDatabase([_cd], webhook.user_id);
          break;
        case WebhookDomain.SLEEP:
          console.log("Sleep")
          const _sd = await this.whoopSleepService.getSingleSleepFromWhoopApi(access_token, webhook.id);
          console.log("Sleep:", _sd);
          this.whoopSleepService.saveSleepToDatabase([_sd], webhook.user_id);
          break;
        case WebhookDomain.WORKOUT:
          console.log("Workout")
          const _wd = await this.whoopWorkoutService.getSingleWorkoutFromWhoopApi(access_token, webhook.id);
          this.whoopWorkoutService.saveWorkoutsToDatabase([_wd], webhook.user_id);
          break;
        case WebhookDomain.RECOVERY:
          console.log("Recovery")
          const _rd = await this.whoopRecoveryService.getSingleRecoveryFromWhoopApi(access_token, webhook.id);
            this.whoopRecoveryService.saveRecoveryToDatabase([_rd], webhook.user_id);
          break;
        }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new Error('Failed to handle webhook', { cause: error });
    }
  }
}
