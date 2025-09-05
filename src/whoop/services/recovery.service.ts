import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Transaction, Sequelize } from 'sequelize';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { WhoopRecovery } from 'src/whoop/models/recovery.model';
import { WhoopRecoveryScore } from 'src/whoop/models/recovery_score.model';
import { WhoopCycle } from 'src/whoop/models/cycle.model';
import { WhoopSleep } from 'src/whoop/models/sleep.model';
import { CryptoUtil } from 'src/utils';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  WhoopRecoveryData,
  WhoopRecoveryApiResponse,
  WhoopRecoveryDataWithIds,
  WhoopRecoveryServiceResponse,
} from '../dtos';

@Injectable()
export class WhoopRecoveryService {
  private readonly cryptoUtil = new CryptoUtil();

  constructor(
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @InjectModel(WhoopRecovery)
    private readonly whoopRecoveryModel: typeof WhoopRecovery,
    @InjectModel(WhoopRecoveryScore)
    private readonly whoopRecoveryScoreModel: typeof WhoopRecoveryScore,
    @InjectModel(WhoopCycle)
    private readonly whoopCycleModel: typeof WhoopCycle,
    @InjectModel(WhoopSleep)
    private readonly whoopSleepModel: typeof WhoopSleep,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly httpService: HttpService,
  ) {}

  private async getRecoveryFromWhoopApi(
    access_token: string,
    next_token: string | null,
  ): Promise<WhoopRecoveryApiResponse> {
    let url = `https://api.prod.whoop.com/developer/v2/recovery`;
    if (next_token) {
      url += `?next_token=${next_token}`;
    }

    const response = await firstValueFrom(
      this.httpService.get<WhoopRecoveryApiResponse>(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    );
    return response.data;
  }

  private async saveSingleRecoveryRecord(
    recoveryRecord: WhoopRecoveryData,
    whoopUserId: number,
    transaction: Transaction,
  ): Promise<WhoopRecoveryDataWithIds> {
    console.log(
      `Processing recovery record ${recoveryRecord.id}, score_state: ${recoveryRecord.score_state}`,
    );

    // Check if cycle exists
    const cycleExists = await this.whoopCycleModel.findOne({
      where: { id: recoveryRecord.cycle_id },
      transaction,
    });

    if (!cycleExists) {
      throw new Error(`Cycle ${recoveryRecord.cycle_id} could not be found`);
    }

    // Check if sleep exists
    const sleepExists = await this.whoopSleepModel.findOne({
      where: { id: recoveryRecord.sleep_id },
      transaction,
    });

    if (!sleepExists) {
      throw new Error(`Sleep ${recoveryRecord.sleep_id} could not be found`);
    }

    // Upsert recovery record
    const [recovery] = await this.whoopRecoveryModel.upsert(
      {
        id: recoveryRecord.id,
        cycle_id: recoveryRecord.cycle_id,
        sleep_id: recoveryRecord.sleep_id,
        user_id: whoopUserId,
        created_at: new Date(recoveryRecord.created_at),
        updated_at: new Date(recoveryRecord.updated_at),
        score_state: recoveryRecord.score_state,
      } as WhoopRecovery,
      { transaction },
    );

    // Initialize score data
    let score: WhoopRecoveryScore | null = null;

    // Process score data if available
    if (recoveryRecord.score_state === 'SCORED' && recoveryRecord.score) {
      const [savedScore, created] =
        await this.whoopRecoveryScoreModel.findOrCreate({
          where: { recovery_id: recovery.id },
          defaults: {
            recovery_id: recovery.id,
            user_calibrating: recoveryRecord.score.user_calibrating,
            recovery_score: recoveryRecord.score.recovery_score,
            resting_heart_rate: recoveryRecord.score.resting_heart_rate,
            hrv_rmssd_milli: recoveryRecord.score.hrv_rmssd_milli,
            spo2_percentage: recoveryRecord.score.spo2_percentage,
            skin_temp_celsius: recoveryRecord.score.skin_temp_celsius,
          } as WhoopRecoveryScore,
          transaction,
        });

      // Update if it already existed
      if (!created) {
        await savedScore.update(
          {
            user_calibrating: recoveryRecord.score.user_calibrating,
            recovery_score: recoveryRecord.score.recovery_score,
            resting_heart_rate: recoveryRecord.score.resting_heart_rate,
            hrv_rmssd_milli: recoveryRecord.score.hrv_rmssd_milli,
            spo2_percentage: recoveryRecord.score.spo2_percentage,
            skin_temp_celsius: recoveryRecord.score.skin_temp_celsius,
          },
          { transaction },
        );
      }

      score = savedScore;
    }

    // Build the complete recovery record with score data
    const recoveryWithScore: WhoopRecoveryDataWithIds = {
      ...recovery.toJSON(),
      score: score
        ? {
            id: score.id,
            recovery_id: score.recovery_id,
            user_calibrating: score.user_calibrating,
            recovery_score: score.recovery_score,
            resting_heart_rate: score.resting_heart_rate,
            hrv_rmssd_milli: score.hrv_rmssd_milli,
            spo2_percentage: score.spo2_percentage,
            skin_temp_celsius: score.skin_temp_celsius,
          }
        : undefined,
    };

    return recoveryWithScore;
  }

  private async saveRecoveryToDatabase(
    recoveryData: WhoopRecoveryData[],
    whoopUserId: number,
  ): Promise<{
    savedRecovery: WhoopRecoveryDataWithIds[];
    allRecoveriesWorked: boolean;
  }> {
    const savedRecovery: WhoopRecoveryDataWithIds[] = [];
    let allRecoveriesWorked = true;
    let processedCount = 0;
    console.log(
      `Starting to save ${recoveryData.length} recovery records to database`,
    );

    for (const recoveryRecord of recoveryData) {
      processedCount++;

      // Create a transaction for each recovery record
      const transaction = await this.sequelize.transaction();

      try {
        const recoveryWithScore = await this.saveSingleRecoveryRecord(
          recoveryRecord,
          whoopUserId,
          transaction,
        );

        // Commit the transaction
        await transaction.commit();
        savedRecovery.push(recoveryWithScore);
        console.log(
          `Successfully processed recovery record ${recoveryRecord.id}`,
        );
      } catch (error) {
        allRecoveriesWorked = false;
        // Rollback the transaction on error
        await transaction.rollback();
        console.error(
          `Error saving recovery record ${recoveryRecord.id}:`,
          error,
        );
        // Continue with other recovery records even if one fails
      }
    }

    console.log(
      `Successfully saved ${savedRecovery.length} recovery records to database`,
    );
    console.log(
      `Processed ${processedCount} out of ${recoveryData.length} total records from API`,
    );
    return {
      savedRecovery,
      allRecoveriesWorked,
    };
  }

  async createRecovery(
    whoop_user_id: number,
    max_pages: number = 10,
  ): Promise<WhoopRecoveryServiceResponse> {
    // Find Whoop user
    const whoopUser = await this.whoopUserModel.findOne({
      where: { id: whoop_user_id },
    });
    if (!whoopUser) {
      throw new Error('Whoop user not found');
    }

    const access_token = this.cryptoUtil.simpleDecrypt(
      whoopUser.access_token_encrypted,
    );

    let allSavedRecovery: WhoopRecoveryDataWithIds[] = [];

    try {
      let next_token: string | null = null;
      for (let i = 0; i < max_pages; i++) {
        const recoveryResponse = await this.getRecoveryFromWhoopApi(
          access_token,
          next_token,
        );
        next_token = recoveryResponse.next_token;

        const { savedRecovery, allRecoveriesWorked } =
          await this.saveRecoveryToDatabase(
            recoveryResponse.records,
            whoop_user_id,
          );

        allSavedRecovery = allSavedRecovery.concat(savedRecovery);

        if (!allRecoveriesWorked || !next_token) {
          break;
        }
      }

      return {
        ok: true,
        message: `Successfully processed ${allSavedRecovery.length} recovery records`,
        data: {
          num_records_saved: allSavedRecovery.length,
          records: allSavedRecovery,
        },
      };
    } catch (error) {
      console.error('Error fetching or saving recovery data:', error);
      throw new Error('Failed to fetch or save recovery data from Whoop API');
    }
  }
}
