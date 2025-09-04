import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Transaction, Sequelize } from 'sequelize';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { User } from 'src/user/models/user.model';
import { WhoopSleep } from 'src/whoop/models/sleep.model';
import { WhoopSleepScore } from 'src/whoop/models/sleep_score.model';
import { WhoopSleepStageSummary } from 'src/whoop/models/sleep_stage_summary.model';
import { WhoopSleepNeeded } from 'src/whoop/models/sleep_needed.model';
import { WhoopCycle } from 'src/whoop/models/cycle.model';
import { WhoopCycleScore } from 'src/whoop/models/cycle_score.model';
import { CryptoUtil } from 'src/utils';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { 
  WhoopSleepApiData, 
  WhoopSleepApiResponse, 
  WhoopSleepDatabaseData, 
  WhoopSleepServiceResponse 
} from '../dtos';


@Injectable()
export class WhoopSleepService {
  private readonly cryptoUtil = new CryptoUtil();

  constructor(
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @InjectModel(WhoopCycle) private readonly whoopCycleModel: typeof WhoopCycle,
    @InjectModel(WhoopSleep) private readonly whoopSleepModel: typeof WhoopSleep,
    @InjectModel(WhoopSleepScore)
    private readonly whoopSleepScoreModel: typeof WhoopSleepScore,
    @InjectModel(WhoopSleepStageSummary)
    private readonly whoopSleepStageSummaryModel: typeof WhoopSleepStageSummary,
    @InjectModel(WhoopSleepNeeded)
    private readonly whoopSleepNeededModel: typeof WhoopSleepNeeded,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly httpService: HttpService,
  ) {}

  private async getAllSleepFromWhoopApi(
    access_token: string,
    max_pages: number = 1,
  ): Promise<WhoopSleepApiResponse> {
    let allSleep: WhoopSleepApiData[] = [];
    let nextToken: string | null = null;
    let hasMoreData = true;
    let page = 0;
    console.log(`Fetching sleep data from Whoop API, max_pages: ${max_pages}`);

    // Fetch all pages of sleep data
    while (hasMoreData && page < max_pages) {
      const url = nextToken
        ? `https://api.prod.whoop.com/developer/v2/activity/sleep?next_token=${nextToken}`
        : `https://api.prod.whoop.com/developer/v2/activity/sleep`;

      const response = await firstValueFrom(
        this.httpService.get<WhoopSleepApiResponse>(url, {
          headers: { Authorization: `Bearer ${access_token}` },
        }),
      );

      const responseData: WhoopSleepApiResponse = response.data;
      if (responseData && responseData.records) {
        allSleep = allSleep.concat(responseData.records);
      }
      nextToken = (responseData && responseData.next_token) || null;
      hasMoreData = nextToken !== null;
      page++;
    }

    console.log(`Fetched ${allSleep.length} total sleep records from Whoop API`);

    return {
      records: allSleep,
      next_token: null, // We've fetched everything
    };
  }

  /**
   * Saves a single sleep record with all its related data in a single transaction
   */
  private async saveSingleSleepRecord(
    sleepRecord: WhoopSleepApiData,
    whoopUserId: number,
    transaction: Transaction,
  ): Promise<WhoopSleepDatabaseData> {
    console.log(`Processing sleep record ${sleepRecord.id}, score_state: ${sleepRecord.score_state}`);

    // Check if cycle exists
    const cycleExists = await this.whoopCycleModel.findOne({
      where: { id: sleepRecord.cycle_id },
      transaction,
    });

    if (!cycleExists) {
      throw new Error(`Cycle ${sleepRecord.cycle_id} could not be found`);
    }

    // Upsert sleep record
    const [sleep] = await this.whoopSleepModel.upsert({
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
    } as WhoopSleep, { transaction });

    console.log(`Sleep record ${sleepRecord.id} saved successfully`);

    // Initialize related data
    let score: WhoopSleepScore | null = null;
    let stageSummary: WhoopSleepStageSummary | null = null;
    let sleepNeeded: WhoopSleepNeeded | null = null;

    // Process score data if available
    if (sleepRecord.score_state === 'SCORED' && sleepRecord.score) {
      console.log(`Processing score data for sleep record ${sleepRecord.id}`);

      // Find or create sleep score
      console.log(`Looking for existing sleep score for sleep_id: ${sleep.id}`);
      const [savedScore, created] = await this.whoopSleepScoreModel.findOrCreate({
        where: { sleep_id: sleep.id },
        defaults: {
          sleep_id: sleep.id,
          respiratory_rate: sleepRecord.score.respiratory_rate,
          sleep_performance_percentage: sleepRecord.score.sleep_performance_percentage,
          sleep_consistency_percentage: sleepRecord.score.sleep_consistency_percentage,
          sleep_efficiency_percentage: sleepRecord.score.sleep_efficiency_percentage,
        } as any,
        transaction,
      });

      console.log(`Sleep score ${created ? 'created' : 'found'}, ID: ${savedScore.id}`);

      // Update if it already existed
      if (!created) {
        console.log(`Updating existing sleep score ID: ${savedScore.id}`);
        await savedScore.update({
          respiratory_rate: sleepRecord.score.respiratory_rate,
          sleep_performance_percentage: sleepRecord.score.sleep_performance_percentage,
          sleep_consistency_percentage: sleepRecord.score.sleep_consistency_percentage,
          sleep_efficiency_percentage: sleepRecord.score.sleep_efficiency_percentage,
        }, { transaction });
      }

      score = savedScore;

      // Save stage summary if available
      if (sleepRecord.score.stage_summary) {
        console.log(`Processing stage summary for sleep_score_id: ${score.id}`);
        // Find existing stage summary or create new one
        let existingStageSummary = await this.whoopSleepStageSummaryModel.findOne({
          where: { sleep_score_id: score.id },
          transaction,
        });

        if (existingStageSummary) {
          console.log(`Updating existing stage summary for sleep_score_id: ${score.id}`);
          // Update existing stage summary
          await existingStageSummary.update({
            total_in_bed_time_milli: sleepRecord.score.stage_summary.total_in_bed_time_milli,
            total_awake_time_milli: sleepRecord.score.stage_summary.total_awake_time_milli,
            total_no_data_time_milli: sleepRecord.score.stage_summary.total_no_data_time_milli,
            total_light_sleep_time_milli: sleepRecord.score.stage_summary.total_light_sleep_time_milli,
            total_slow_wave_sleep_time_milli: sleepRecord.score.stage_summary.total_slow_wave_sleep_time_milli,
            total_rem_sleep_time_milli: sleepRecord.score.stage_summary.total_rem_sleep_time_milli,
            sleep_cycle_count: sleepRecord.score.stage_summary.sleep_cycle_count,
            disturbance_count: sleepRecord.score.stage_summary.disturbance_count,
          }, { transaction });
          stageSummary = existingStageSummary;
        } else {
          console.log(`Creating new stage summary for sleep_score_id: ${score.id}`);
          // Create new stage summary
          stageSummary = await this.whoopSleepStageSummaryModel.create({
            sleep_score_id: score.id,
            total_in_bed_time_milli: sleepRecord.score.stage_summary.total_in_bed_time_milli,
            total_awake_time_milli: sleepRecord.score.stage_summary.total_awake_time_milli,
            total_no_data_time_milli: sleepRecord.score.stage_summary.total_no_data_time_milli,
            total_light_sleep_time_milli: sleepRecord.score.stage_summary.total_light_sleep_time_milli,
            total_slow_wave_sleep_time_milli: sleepRecord.score.stage_summary.total_slow_wave_sleep_time_milli,
            total_rem_sleep_time_milli: sleepRecord.score.stage_summary.total_rem_sleep_time_milli,
            sleep_cycle_count: sleepRecord.score.stage_summary.sleep_cycle_count,
            disturbance_count: sleepRecord.score.stage_summary.disturbance_count,
          } as any, { transaction });
        }
        console.log(`Stage summary processed successfully`);
      }

      // Save sleep needed if available
      if (sleepRecord.score.sleep_needed) {
        console.log(`Processing sleep needed for sleep_score_id: ${score.id}`);
        // Find existing sleep needed or create new one
        let existingSleepNeeded = await this.whoopSleepNeededModel.findOne({
          where: { sleep_score_id: score.id },
          transaction,
        });

        if (existingSleepNeeded) {
          console.log(`Updating existing sleep needed for sleep_score_id: ${score.id}`);
          // Update existing sleep needed
          await existingSleepNeeded.update({
            baseline_milli: sleepRecord.score.sleep_needed.baseline_milli,
            need_from_sleep_debt_milli: sleepRecord.score.sleep_needed.need_from_sleep_debt_milli,
            need_from_recent_strain_milli: sleepRecord.score.sleep_needed.need_from_recent_strain_milli,
            need_from_recent_nap_milli: sleepRecord.score.sleep_needed.need_from_recent_nap_milli,
          }, { transaction });
          sleepNeeded = existingSleepNeeded;
        } else {
          console.log(`Creating new sleep needed for sleep_score_id: ${score.id}`);
          // Create new sleep needed
          sleepNeeded = await this.whoopSleepNeededModel.create({
            sleep_score_id: score.id,
            baseline_milli: sleepRecord.score.sleep_needed.baseline_milli,
            need_from_sleep_debt_milli: sleepRecord.score.sleep_needed.need_from_sleep_debt_milli,
            need_from_recent_strain_milli: sleepRecord.score.sleep_needed.need_from_recent_strain_milli,
            need_from_recent_nap_milli: sleepRecord.score.sleep_needed.need_from_recent_nap_milli,
          } as any, { transaction });
        }
        console.log(`Sleep needed processed successfully`);
      }
    } else {
      console.log(`No score data for sleep record ${sleepRecord.id}`);
    }

    // Build the complete sleep record with all related data
    const sleepWithScore: WhoopSleepDatabaseData = {
      ...sleep.toJSON(),
      score: score ? {
        id: score.id,
        sleep_id: score.sleep_id,
        respiratory_rate: score.respiratory_rate,
        sleep_performance_percentage: score.sleep_performance_percentage,
        sleep_consistency_percentage: score.sleep_consistency_percentage,
        sleep_efficiency_percentage: score.sleep_efficiency_percentage,
        stage_summary: stageSummary ? {
          total_in_bed_time_milli: stageSummary.total_in_bed_time_milli,
          total_awake_time_milli: stageSummary.total_awake_time_milli,
          total_no_data_time_milli: stageSummary.total_no_data_time_milli,
          total_light_sleep_time_milli: stageSummary.total_light_sleep_time_milli,
          total_slow_wave_sleep_time_milli: stageSummary.total_slow_wave_sleep_time_milli,
          total_rem_sleep_time_milli: stageSummary.total_rem_sleep_time_milli,
          sleep_cycle_count: stageSummary.sleep_cycle_count,
          disturbance_count: stageSummary.disturbance_count,
        } : undefined,
        sleep_needed: sleepNeeded ? {
          baseline_milli: sleepNeeded.baseline_milli,
          need_from_sleep_debt_milli: sleepNeeded.need_from_sleep_debt_milli,
          need_from_recent_strain_milli: sleepNeeded.need_from_recent_strain_milli,
          need_from_recent_nap_milli: sleepNeeded.need_from_recent_nap_milli,
        } : undefined,
      } : null,
    };

    console.log(`Successfully processed sleep record ${sleepRecord.id} in transaction`);
    return sleepWithScore;
  }

  /**
   * Alternative method: Save all sleep records in a single transaction
   * Use this for better performance when processing many records
   */
  private async saveAllSleepRecordsInSingleTransaction(
    sleepData: WhoopSleepApiData[],
    whoopUserId: number,
  ): Promise<WhoopSleepDatabaseData[]> {
    const transaction = await this.sequelize.transaction();
    const savedSleep: WhoopSleepDatabaseData[] = [];
    
    try {
      console.log(`Starting to save ${sleepData.length} sleep records in single transaction`);

      for (const sleepRecord of sleepData) {
        const sleepWithScore = await this.saveSingleSleepRecord(
          sleepRecord,
          whoopUserId,
          transaction,
        );
        savedSleep.push(sleepWithScore);
      }

      // Commit the entire transaction
      await transaction.commit();
      console.log(`Successfully saved ${savedSleep.length} sleep records in single transaction`);
      
    } catch (error) {
      // Rollback the entire transaction on any error
      await transaction.rollback();
      console.error('Error saving sleep records in transaction:', error);
      throw error;
    }

    return savedSleep;
  }

  private async saveSleepToDatabase(
    sleepData: WhoopSleepApiData[],
    whoopUserId: number,
  ): Promise<WhoopSleepDatabaseData[]> {
    const savedSleep: WhoopSleepDatabaseData[] = [];
    let processedCount = 0;
    console.log(`Starting to save ${sleepData.length} sleep records to database`);

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
        // Rollback the transaction on error
        await transaction.rollback();
        console.error(`Error saving sleep record ${sleepRecord.id}:`, error);
        // Continue with other sleep records even if one fails
      }
    }

    console.log(`Successfully saved ${savedSleep.length} sleep records to database`);
    console.log(`Processed ${processedCount} out of ${sleepData.length} total records from API`);
    return savedSleep;
  }

  async createSleep(whoop_user_id: number): Promise<WhoopSleepServiceResponse> {
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

    try {
      // Fetch sleep data from Whoop API
      const sleepResponse = await this.getAllSleepFromWhoopApi(access_token);

      // Save sleep data to database
      const savedSleep = await this.saveSleepToDatabase(
        sleepResponse.records,
        whoop_user_id,
      );

      return {
        ok: true,
        message: `Successfully processed ${savedSleep.length} sleep records`,
        data: {
          total_sleep_records: sleepResponse.records.length,
          saved_sleep_records: savedSleep.length,
          sleep_records: savedSleep,
        },
      };
    } catch (error) {
      console.error('Error fetching or saving sleep data:', error);
      throw new Error('Failed to fetch or save sleep data from Whoop API');
    }
  }
}
