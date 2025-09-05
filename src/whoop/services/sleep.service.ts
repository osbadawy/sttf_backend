import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Transaction, Sequelize } from 'sequelize';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { WhoopSleep } from 'src/whoop/models/sleep.model';
import { WhoopSleepScore } from 'src/whoop/models/sleep_score.model';
import { WhoopSleepStageSummary } from 'src/whoop/models/sleep_stage_summary.model';
import { WhoopSleepNeeded } from 'src/whoop/models/sleep_needed.model';
import { WhoopCycle } from 'src/whoop/models/cycle.model';
import { CryptoUtil } from 'src/utils';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  WhoopSleepApiData,
  WhoopSleepApiResponse,
  WhoopSleepDatabaseData,
  WhoopSleepServiceResponse,
} from '../dtos';

@Injectable()
export class WhoopSleepService {
  private readonly cryptoUtil = new CryptoUtil();

  constructor(
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @InjectModel(WhoopCycle)
    private readonly whoopCycleModel: typeof WhoopCycle,
    @InjectModel(WhoopSleep)
    private readonly whoopSleepModel: typeof WhoopSleep,
    @InjectModel(WhoopSleepScore)
    private readonly whoopSleepScoreModel: typeof WhoopSleepScore,
    @InjectModel(WhoopSleepStageSummary)
    private readonly whoopSleepStageSummaryModel: typeof WhoopSleepStageSummary,
    @InjectModel(WhoopSleepNeeded)
    private readonly whoopSleepNeededModel: typeof WhoopSleepNeeded,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly httpService: HttpService,
  ) {}

  private async getSleepFromWhoopApi(
    access_token: string,
    next_token: string | null,
  ): Promise<WhoopSleepApiResponse> {
    let url = `https://api.prod.whoop.com/developer/v2/activity/sleep`;
    if (next_token) {
      url += `?next_token=${next_token}`;
    }

    const response = await firstValueFrom(
      this.httpService.get<WhoopSleepApiResponse>(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    );
    return response.data;
  }

  private async saveSingleSleepRecord(
    sleepRecord: WhoopSleepApiData,
    whoopUserId: number,
    transaction: Transaction,
  ): Promise<WhoopSleepDatabaseData> {
    console.log(
      `Processing sleep record ${sleepRecord.id}, score_state: ${sleepRecord.score_state}`,
    );

    // Check if cycle exists
    const cycleExists = await this.whoopCycleModel.findOne({
      where: { id: sleepRecord.cycle_id },
      transaction,
    });

    if (!cycleExists) {
      throw new Error(`Cycle ${sleepRecord.cycle_id} could not be found`);
    }

    // Upsert sleep record
    const [sleep] = await this.whoopSleepModel.upsert(
      {
        id: sleepRecord.id,
        cycle_id: sleepRecord.cycle_id,
        user_id: whoopUserId,
        created_at: new Date(sleepRecord.created_at),
        updated_at: new Date(sleepRecord.updated_at),
        start: new Date(sleepRecord.start),
        end: new Date(sleepRecord.end),
        timezone_offset: sleepRecord.timezone_offset,
        nap: sleepRecord.nap,
        score_state: sleepRecord.score_state,
      } as WhoopSleep,
      { transaction },
    );

    // Initialize related data
    let score: WhoopSleepScore | null = null;
    let stageSummary: WhoopSleepStageSummary | null = null;
    let sleepNeeded: WhoopSleepNeeded | null = null;

    // Process score data if available
    if (sleepRecord.score_state === 'SCORED' && sleepRecord.score) {
      const [savedScore, created] =
        await this.whoopSleepScoreModel.findOrCreate({
          where: { sleep_id: sleep.id },
          defaults: {
            sleep_id: sleep.id,
            respiratory_rate: sleepRecord.score.respiratory_rate,
            sleep_performance_percentage:
              sleepRecord.score.sleep_performance_percentage,
            sleep_consistency_percentage:
              sleepRecord.score.sleep_consistency_percentage,
            sleep_efficiency_percentage:
              sleepRecord.score.sleep_efficiency_percentage,
          } as WhoopSleepScore,
          transaction,
        });


      // Update if it already existed
      if (!created) {
        await savedScore.update(
          {
            respiratory_rate: sleepRecord.score.respiratory_rate,
            sleep_performance_percentage:
              sleepRecord.score.sleep_performance_percentage,
            sleep_consistency_percentage:
              sleepRecord.score.sleep_consistency_percentage,
            sleep_efficiency_percentage:
              sleepRecord.score.sleep_efficiency_percentage,
          },
          { transaction },
        );
      }

      score = savedScore;

      // Save stage summary if available
      if (sleepRecord.score.stage_summary) {
        // Find existing stage summary or create new one
        const existingStageSummary =
          await this.whoopSleepStageSummaryModel.findOne({
            where: { sleep_score_id: score.id },
            transaction,
          });

        if (existingStageSummary) {
          // Update existing stage summary
          await existingStageSummary.update(
            {
              total_in_bed_time_milli:
                sleepRecord.score.stage_summary.total_in_bed_time_milli,
              total_awake_time_milli:
                sleepRecord.score.stage_summary.total_awake_time_milli,
              total_no_data_time_milli:
                sleepRecord.score.stage_summary.total_no_data_time_milli,
              total_light_sleep_time_milli:
                sleepRecord.score.stage_summary.total_light_sleep_time_milli,
              total_slow_wave_sleep_time_milli:
                sleepRecord.score.stage_summary
                  .total_slow_wave_sleep_time_milli,
              total_rem_sleep_time_milli:
                sleepRecord.score.stage_summary.total_rem_sleep_time_milli,
              sleep_cycle_count:
                sleepRecord.score.stage_summary.sleep_cycle_count,
              disturbance_count:
                sleepRecord.score.stage_summary.disturbance_count,
            },
            { transaction },
          );
          stageSummary = existingStageSummary;
        } else {
          // Create new stage summary
          stageSummary = await this.whoopSleepStageSummaryModel.create(
            {
              sleep_score_id: score.id,
              total_in_bed_time_milli:
                sleepRecord.score.stage_summary.total_in_bed_time_milli,
              total_awake_time_milli:
                sleepRecord.score.stage_summary.total_awake_time_milli,
              total_no_data_time_milli:
                sleepRecord.score.stage_summary.total_no_data_time_milli,
              total_light_sleep_time_milli:
                sleepRecord.score.stage_summary.total_light_sleep_time_milli,
              total_slow_wave_sleep_time_milli:
                sleepRecord.score.stage_summary
                  .total_slow_wave_sleep_time_milli,
              total_rem_sleep_time_milli:
                sleepRecord.score.stage_summary.total_rem_sleep_time_milli,
              sleep_cycle_count:
                sleepRecord.score.stage_summary.sleep_cycle_count,
              disturbance_count:
                sleepRecord.score.stage_summary.disturbance_count,
            } as any,
            { transaction },
          );
        }
      }

      // Save sleep needed if available
      if (sleepRecord.score.sleep_needed) {
        // Find existing sleep needed or create new one
        const existingSleepNeeded = await this.whoopSleepNeededModel.findOne({
          where: { sleep_score_id: score.id },
          transaction,
        });

        if (existingSleepNeeded) {
          // Update existing sleep needed
          await existingSleepNeeded.update(
            {
              baseline_milli: sleepRecord.score.sleep_needed.baseline_milli,
              need_from_sleep_debt_milli:
                sleepRecord.score.sleep_needed.need_from_sleep_debt_milli,
              need_from_recent_strain_milli:
                sleepRecord.score.sleep_needed.need_from_recent_strain_milli,
              need_from_recent_nap_milli:
                sleepRecord.score.sleep_needed.need_from_recent_nap_milli,
            },
            { transaction },
          );
          sleepNeeded = existingSleepNeeded;
        } else {
          // Create new sleep needed
          sleepNeeded = await this.whoopSleepNeededModel.create(
            {
              sleep_score_id: score.id,
              baseline_milli: sleepRecord.score.sleep_needed.baseline_milli,
              need_from_sleep_debt_milli:
                sleepRecord.score.sleep_needed.need_from_sleep_debt_milli,
              need_from_recent_strain_milli:
                sleepRecord.score.sleep_needed.need_from_recent_strain_milli,
              need_from_recent_nap_milli:
                sleepRecord.score.sleep_needed.need_from_recent_nap_milli,
            } as any,
            { transaction },
          );
        }
      }
    }

    // Build the complete sleep record with all related data
    const sleepWithScore: WhoopSleepDatabaseData = {
      ...sleep.toJSON(),
      score: score
        ? {
            id: score.id,
            sleep_id: score.sleep_id,
            respiratory_rate: score.respiratory_rate,
            sleep_performance_percentage: score.sleep_performance_percentage,
            sleep_consistency_percentage: score.sleep_consistency_percentage,
            sleep_efficiency_percentage: score.sleep_efficiency_percentage,
            stage_summary: stageSummary
              ? {
                  total_in_bed_time_milli: stageSummary.total_in_bed_time_milli,
                  total_awake_time_milli: stageSummary.total_awake_time_milli,
                  total_no_data_time_milli:
                    stageSummary.total_no_data_time_milli,
                  total_light_sleep_time_milli:
                    stageSummary.total_light_sleep_time_milli,
                  total_slow_wave_sleep_time_milli:
                    stageSummary.total_slow_wave_sleep_time_milli,
                  total_rem_sleep_time_milli:
                    stageSummary.total_rem_sleep_time_milli,
                  sleep_cycle_count: stageSummary.sleep_cycle_count,
                  disturbance_count: stageSummary.disturbance_count,
                }
              : undefined,
            sleep_needed: sleepNeeded
              ? {
                  baseline_milli: sleepNeeded.baseline_milli,
                  need_from_sleep_debt_milli:
                    sleepNeeded.need_from_sleep_debt_milli,
                  need_from_recent_strain_milli:
                    sleepNeeded.need_from_recent_strain_milli,
                  need_from_recent_nap_milli:
                    sleepNeeded.need_from_recent_nap_milli,
                }
              : undefined,
          }
        : null,
    };
    return sleepWithScore;
  }

  private async saveSleepToDatabase(
    sleepData: WhoopSleepApiData[],
    whoopUserId: number,
  ): Promise<{
    savedSleep: WhoopSleepDatabaseData[];
    allSleepsWorked: boolean;
  }> {
    const savedSleep: WhoopSleepDatabaseData[] = [];
    let allSleepsWorked = true;
    let processedCount = 0;
    console.log(
      `Starting to save ${sleepData.length} sleep records to database`,
    );

    for (const sleepRecord of sleepData) {
      processedCount++;

      // Create a transaction for each sleep record
      const transaction = await this.sequelize.transaction();

      try {
        const sleepWithScore = await this.saveSingleSleepRecord(
          sleepRecord,
          whoopUserId,
          transaction,
        );

        // Commit the transaction
        await transaction.commit();
        savedSleep.push(sleepWithScore);
        console.log(`Successfully processed sleep record ${sleepRecord.id}`);
      } catch (error) {
        allSleepsWorked = false;
        // Rollback the transaction on error
        await transaction.rollback();
        console.error(`Error saving sleep record ${sleepRecord.id}:`, error);
        // Continue with other sleep records even if one fails
      }
    }

    console.log(
      `Successfully saved ${savedSleep.length} sleep records to database`,
    );
    console.log(
      `Processed ${processedCount} out of ${sleepData.length} total records from API`,
    );
    return {
      savedSleep,
      allSleepsWorked,
    };
  }

  async createSleep(
    whoop_user_id: number,
    max_pages: number = 10,
  ): Promise<WhoopSleepServiceResponse> {
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

    let allSavedSleep: WhoopSleepDatabaseData[] = [];

    try {
      let next_token: string | null = null;
      for (let i = 0; i < max_pages; i++) {
        const sleepResponse = await this.getSleepFromWhoopApi(
          access_token,
          next_token,
        );
        next_token = sleepResponse.next_token;

        const { savedSleep, allSleepsWorked } = await this.saveSleepToDatabase(
          sleepResponse.records,
          whoop_user_id,
        );

        allSavedSleep = allSavedSleep.concat(savedSleep);

        if (!allSleepsWorked || !next_token) {
          break;
        }
      }

      return {
        ok: true,
        message: `Successfully processed ${allSavedSleep.length} sleep records`,
        data: {
          saved_sleep_records: allSavedSleep.length,
          sleep_records: allSavedSleep,
        },
      };
    } catch (error) {
      console.error('Error fetching or saving sleep data:', error);
      throw new Error('Failed to fetch or save sleep data from Whoop API');
    }
  }
}
