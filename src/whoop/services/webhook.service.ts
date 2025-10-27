import { Inject, Injectable } from '@nestjs/common';
import { WhoopCycleService } from './cycle.service';
import { WhoopSleepService } from './sleep.service';
import { WhoopWorkoutService } from './workout.service';
import { WhoopRecoveryService } from './recovery.service';
import { WhoopUserService } from './user.service';
import { WhoopWebhookAccessTokenGuard } from 'src/whoop/guards';
import { WhoopUser } from 'src/whoop/models';

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
    @Inject(WhoopUserService)
    private readonly whoopUserService: WhoopUserService,
    @Inject(WhoopWebhookAccessTokenGuard)
    private readonly whoopWebhookAccessTokenGuard: WhoopWebhookAccessTokenGuard,
  ) {}

  async handleWebhook(webhook: Webhook, access_token: string) {
    const domain = webhook.type.split('.')[0] as WebhookDomain;

    try {
      switch (domain) {
        case WebhookDomain.WORKOUT: {
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
        }
        case WebhookDomain.SLEEP: {
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
        }
        case WebhookDomain.RECOVERY: {
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
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new Error('Failed to handle webhook', { cause: error });
    }
  }

  async updateAllWhoopData() {
    {
      const allWhoopUsers = await this.whoopUserService.getAllWhoopUsers();
      let successUsers: WhoopUser[] = [];
      let errorUsers: WhoopUser[] = [];

      for (const whoopUser of allWhoopUsers) {
        try {
          // Get access tokens from database
          const access =
            await this.whoopWebhookAccessTokenGuard.getAccessFromDatabase(
              whoopUser.id.toString(),
            );

          // Check if token needs refresh (expires within 5 minutes)
          const now = new Date();
          if (
            access &&
            access.expires_at < new Date(now.getTime() + 5 * 60 * 1000)
          ) {
            await this.whoopWebhookAccessTokenGuard.refreshAccessToken(
              access,
              access.user_id,
            );
          }

          // Now fetch the data for this user
          await this.whoopCycleService.createCycles(whoopUser.id);
          await this.whoopSleepService.createSleep(whoopUser.id);
          await this.whoopRecoveryService.createRecovery(whoopUser.id);
          await this.whoopWorkoutService.createWorkout(whoopUser.id);
          successUsers.push(whoopUser);
        } catch (error) {
          console.error(
            `Error updating Whoop data for user ${whoopUser.id}:`,
            error,
          );
          errorUsers.push(whoopUser);
        }
      }

      return {
        successUsers,
        errorUsers,
      };
    }
  }
}
