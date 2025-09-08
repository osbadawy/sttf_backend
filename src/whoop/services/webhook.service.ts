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
    @Inject(WhoopCycleService)
    private readonly whoopCycleService: WhoopCycleService,
    @Inject(WhoopSleepService)
    private readonly whoopSleepService: WhoopSleepService,
    @Inject(WhoopWorkoutService)
    private readonly whoopWorkoutService: WhoopWorkoutService,
    @Inject(WhoopRecoveryService)
    private readonly whoopRecoveryService: WhoopRecoveryService,
  ) {}

  async handleWebhook(webhook: Webhook, access_token: string) {
    const [domain, process] = webhook.type.split('.') as [
      WebhookDomain,
      WebhookProcess,
    ];
    console.log('Domain:', domain);
    console.log('Access Token:', access_token);

    try {
      switch (domain) {
        case WebhookDomain.WORKOUT:
          const _w =
            await this.whoopWorkoutService.getSingleWorkoutFromWhoopApi(
              access_token,
              webhook.id,
            );
          await this.whoopWorkoutService.saveWorkoutsToDatabase(
            [_w],
            webhook.user_id,
          );
          break;
        case WebhookDomain.SLEEP:
          const _s = await this.whoopSleepService.getSingleSleepFromWhoopApi(
            access_token,
            webhook.id,
          );
          const _sc = await this.whoopCycleService.getSingleCycleFromWhoopApi(
            access_token,
            _s.cycle_id,
          );
          await this.whoopCycleService.saveCyclesToDatabase(
            [_sc],
            webhook.user_id,
          );
          await this.whoopSleepService.saveSleepToDatabase(
            [_s],
            webhook.user_id,
          );
          break;
        case WebhookDomain.RECOVERY:
          const _rs = await this.whoopSleepService.getSingleSleepFromWhoopApi(
            access_token,
            webhook.id,
          );
          const _rc = await this.whoopCycleService.getSingleCycleFromWhoopApi(
            access_token,
            _rs.cycle_id,
          );
          const _r =
            await this.whoopRecoveryService.getSingleRecoveryFromWhoopApi(
              access_token,
              _rs.cycle_id,
            );
          await this.whoopCycleService.saveCyclesToDatabase(
            [_rc],
            webhook.user_id,
          );
          await this.whoopSleepService.saveSleepToDatabase(
            [_rs],
            webhook.user_id,
          );
          await this.whoopRecoveryService.saveRecoveryToDatabase(
            [_r],
            webhook.user_id,
          );
          break;
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new Error('Failed to handle webhook', { cause: error });
    }
  }
}
