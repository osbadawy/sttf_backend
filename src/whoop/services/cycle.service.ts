import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Transaction, Sequelize, Op } from 'sequelize';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { User } from 'src/user/models/user.model';
import { WhoopCycle } from 'src/whoop/models/cycle.model';
import { WhoopCycleScore } from 'src/whoop/models/cycle_score.model';
import { CryptoUtil } from 'src/utils';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  WhoopCycleData,
  WhoopCycleApiResponse,
  WhoopCycleDataWithIds,
  WhoopCycleServiceResponse,
} from '../dtos';
import { WhoopSleep } from '../models';

@Injectable()
export class WhoopCycleService {
  private readonly cryptoUtil = new CryptoUtil();

  constructor(
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(WhoopCycle)
    private readonly whoopCycleModel: typeof WhoopCycle,
    @InjectModel(WhoopCycleScore)
    private readonly whoopCycleScoreModel: typeof WhoopCycleScore,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly httpService: HttpService,
  ) {}

  async getSingleCycleFromWhoopApi(
    access_token: string,
    cycle_id: number,
  ): Promise<WhoopCycleData> {
    const url = `https://api.prod.whoop.com/developer/v2/cycle/${cycle_id}`;
    const response = await firstValueFrom(
      this.httpService.get<WhoopCycleData>(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    );
    return response.data;
  }

  private async getCyclesFromWhoopApi(
    access_token: string,
    next_token: string | null,
  ): Promise<WhoopCycleApiResponse> {
    let url = `https://api.prod.whoop.com/developer/v2/cycle`;
    if (next_token) {
      url += `?next_token=${next_token}`;
    }

    const response = await firstValueFrom(
      this.httpService.get<WhoopCycleApiResponse>(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    );
    return response.data;
  }

  private async saveSingleCycleRecord(
    cycleRecord: WhoopCycleData,
    whoopUserId: number,
    transaction: Transaction,
  ): Promise<WhoopCycleDataWithIds> {
    console.log(
      `Processing cycle record ${cycleRecord.id}, score_state: ${cycleRecord.score_state}`,
    );

    // Upsert cycle record
    const [cycle] = await this.whoopCycleModel.upsert(
      {
        id: cycleRecord.id,
        user_id: whoopUserId,
        created_at: new Date(cycleRecord.created_at),
        updated_at: new Date(cycleRecord.updated_at),
        start: new Date(cycleRecord.start),
        end: cycleRecord.end ? new Date(cycleRecord.end) : null,
        timezone_offset: cycleRecord.timezone_offset,
        score_state: cycleRecord.score_state,
      } as WhoopCycle,
      { transaction },
    );

    // Initialize score data
    let score: WhoopCycleScore | null = null;

    // Process score data if available
    if (cycleRecord.score_state === 'SCORED' && cycleRecord.score) {
      const [savedScore, created] =
        await this.whoopCycleScoreModel.findOrCreate({
          where: { cycle_id: cycle.id },
          defaults: {
            cycle_id: cycle.id,
            strain: cycleRecord.score.strain,
            kilojoule: cycleRecord.score.kilojoule,
            average_heart_rate: cycleRecord.score.average_heart_rate,
            max_heart_rate: cycleRecord.score.max_heart_rate,
          } as WhoopCycleScore,
          transaction,
        });

      // Update if it already existed
      if (!created) {
        await savedScore.update(
          {
            strain: cycleRecord.score.strain,
            kilojoule: cycleRecord.score.kilojoule,
            average_heart_rate: cycleRecord.score.average_heart_rate,
            max_heart_rate: cycleRecord.score.max_heart_rate,
          } as WhoopCycleScore,
          { transaction },
        );
      }

      score = savedScore;
    }

    // Build the complete cycle record with score data
    const cycleWithScore: WhoopCycleDataWithIds = {
      ...cycle.toJSON(),
      score: score
        ? {
            id: score.id,
            cycle_id: score.cycle_id,
            strain: score.strain,
            kilojoule: score.kilojoule,
            average_heart_rate: score.average_heart_rate,
            max_heart_rate: score.max_heart_rate,
          }
        : undefined,
    };

    return cycleWithScore;
  }

  async saveCyclesToDatabase(
    cyclesData: WhoopCycleData[],
    whoopUserId: number,
  ): Promise<{
    savedCycles: WhoopCycleDataWithIds[];
    allCyclesWorked: boolean;
  }> {
    const savedCycles: WhoopCycleDataWithIds[] = [];
    let allCyclesWorked = true;
    let processedCount = 0;
    console.log(
      `Starting to save ${cyclesData.length} cycle records to database`,
    );

    for (const cycleRecord of cyclesData) {
      processedCount++;

      // Create a transaction for each cycle record
      const transaction = await this.sequelize.transaction();

      try {
        const cycleWithScore = await this.saveSingleCycleRecord(
          cycleRecord,
          whoopUserId,
          transaction,
        );

        // Commit the transaction
        await transaction.commit();
        savedCycles.push(cycleWithScore);
        console.log(`Successfully processed cycle record ${cycleRecord.id}`);
      } catch (error) {
        allCyclesWorked = false;
        // Rollback the transaction on error
        await transaction.rollback();
        console.error(`Error saving cycle record ${cycleRecord.id}:`, error);
        // Continue with other cycle records even if one fails
      }
    }

    console.log(
      `Successfully saved ${savedCycles.length} cycle records to database`,
    );
    console.log(
      `Processed ${processedCount} out of ${cyclesData.length} total records from API`,
    );
    return {
      savedCycles,
      allCyclesWorked,
    };
  }

  async createCycles(
    whoop_user_id: number,
    max_pages: number = 10,
  ): Promise<WhoopCycleServiceResponse> {
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

    let allSavedCycles: WhoopCycleDataWithIds[] = [];

    try {
      let next_token: string | null = null;
      for (let i = 0; i < max_pages; i++) {
        const cyclesResponse = await this.getCyclesFromWhoopApi(
          access_token,
          next_token,
        );
        next_token = cyclesResponse.next_token;

        const { savedCycles, allCyclesWorked } =
          await this.saveCyclesToDatabase(
            cyclesResponse.records,
            whoop_user_id,
          );

        allSavedCycles = allSavedCycles.concat(savedCycles);

        if (!allCyclesWorked || !next_token) {
          break;
        }
      }

      return {
        ok: true,
        message: `Successfully processed ${allSavedCycles.length} cycle records`,
        data: {
          num_records_saved: allSavedCycles.length,
          records: allSavedCycles,
        },
      };
    } catch (error) {
      console.error('Error fetching or saving cycle data:', error);
      throw new Error('Failed to fetch or save cycle data from Whoop API');
    }
  }

  async getMultiDayData(
    firebase_id: string,
    days: number = 14,
  ): Promise<WhoopCycleDataWithIds[]> {
    const today_midnight = new Date(new Date().setHours(0, 0, 0, 0));
    const min_date = new Date(
      today_midnight.getTime() - days * 24 * 60 * 60 * 1000,
    );

    const user = await this.userModel.findOne({
      where: { firebase_id },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const whoopUser = await this.whoopUserModel.findOne({
      where: { user_id: user.id },
      include: [
        {
          model: this.whoopCycleModel,
          as: 'cycles',
          required: false,
          where: {
            start: {
              [Op.gte]: min_date,
            },
          },
          order: [['start', 'DESC']],
          include: [
            {
              model: this.whoopCycleScoreModel,
              as: 'score',
              required: false,
            },
          ],
        },
      ],
    });

    if (!whoopUser) {
      throw new Error('Whoop user not found');
    }

    return whoopUser.cycles || [];
  }

  cycleFilter(
    sleep_filter: object,
    recovery_filter: object,
    startDay: Date,
    endDay: Date,
  ): object {
    // Expand the time window: start can be up to 6 hours before startDay, end can be up to 6 hours after endDay
    const expandedStartDay = new Date(startDay.getTime() - 6 * 60 * 60 * 1000); // 6 hours before
    const expandedEndDay = new Date(endDay.getTime() + 6 * 60 * 60 * 1000); // 6 hours after

    return {
      model: this.whoopCycleModel,
      as: 'cycles',
      required: false,
      where: {
        // Get all cycles that start before expandedEndDay and (end after expandedStartDay OR end is null)
        [Op.and]: [
          {
            start: {
              [Op.lte]: expandedEndDay,
            },
          },
          {
            [Op.or]: [
              {
                end: {
                  [Op.gte]: expandedStartDay,
                },
              },
              {
                end: null,
              },
            ],
          },
        ],
      },
      include: [
        {
          model: this.whoopCycleScoreModel,
          as: 'score',
          required: false,
        },
        sleep_filter,
        recovery_filter,
      ],
      order: [['start', 'DESC']],
    };
  }

  private filterCyclesByMiddleTime(
    cycles: WhoopCycle[],
    startDay: Date,
    endDay: Date,
  ): WhoopCycle[] {
    return cycles.filter((cycle) => {
      const middleTime = cycle.end
        ? new Date(
            cycle.start.getTime() +
              (cycle.end.getTime() - cycle.start.getTime()) / 2,
          )
        : new Date(cycle.start.getTime() + 12 * 60 * 60 * 1000); // +12 hours

      return middleTime >= startDay && middleTime <= endDay;
    });
  }

  getDayCycles(
    cycles: WhoopCycle[],
    lastDay: Date,
    days: number,
  ): { [key: string]: WhoopCycle | null } {
    // Starting from today at 00:00 going back days
    const dayTimestamps = Array.from({ length: days }, (_, i) => {
      const date = new Date(lastDay);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const dayCyclesData = {};

    for (const day of dayTimestamps) {
      const endDate = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      const dayCycles = this.filterCyclesByMiddleTime(cycles, day, endDate);

      if (dayCycles.length === 0) {
        dayCyclesData[day.toISOString()] = null;
      }

      if (dayCycles.length === 1) {
        dayCyclesData[day.toISOString()] = dayCycles[0];
      }

      if (dayCycles.length > 1) {
        const longestCycle = dayCycles.sort((a: WhoopCycle, b: WhoopCycle) => {
          const endTime = b.end
            ? b.end.getTime()
            : a.start.getTime() + 12 * 60 * 60 * 1000;
          return endTime - a.start.getTime();
        })[0];
        dayCyclesData[day.toISOString()] = longestCycle;
      }
    }

    return dayCyclesData;
  }

  extractCycleData(cycle: WhoopCycle | null): { [key: string]: any } {
    let performance = 0;
    let stress = 0;
    let strain = 0;
    const sleep = {
      score: 0,
      durationMilli: 0,
      neededMilli: 0,
      stage_summary: {
        total_in_bed_time_milli: 0,
        total_awake_time_milli: 0,
        total_no_data_time_milli: 0,
        total_light_sleep_time_milli: 0,
        total_slow_wave_sleep_time_milli: 0,
        total_rem_sleep_time_milli: 0,
        sleep_cycle_count: 0,
        disturbance_count: 0,
      },
    };

    let restingHeartRate = 0;
    let maxHeartRate = 0;
    let dailyAvgHeartRate = 0;
    let hrv = 0;

    if (cycle && cycle.score) {
      strain = cycle.score.strain / 21;
      dailyAvgHeartRate = cycle.score.average_heart_rate;
      maxHeartRate = cycle.score.max_heart_rate;

      if (cycle.recoveries && cycle.recoveries.length > 0) {
        stress = (100 - (cycle.recoveries[0].score?.recovery_score || 0)) / 100;
        restingHeartRate = cycle.recoveries[0].score?.resting_heart_rate || 0;
        hrv = cycle.recoveries[0].score?.hrv_rmssd_milli || 0;
      }

      if (cycle.sleeps && cycle.sleeps.length > 0) {
        // Choose the sleep which lasts the longest (stop-start) and nap is false
        const longestSleep = cycle.sleeps
          .filter((sleep: WhoopSleep) => !sleep.nap) // Filter out naps
          .sort((a: WhoopSleep, b: WhoopSleep) => {
            const durationA =
              new Date(a.end).getTime() - new Date(a.start).getTime();
            const durationB =
              new Date(b.end).getTime() - new Date(b.start).getTime();
            return durationB - durationA; // Sort by duration descending
          })[0];

        if (longestSleep) {
          sleep.score =
            (longestSleep.score?.sleep_performance_percentage || 0) / 100;
          sleep.durationMilli =
            longestSleep.score?.stage_summary?.total_in_bed_time_milli || 0;
          sleep.neededMilli =
            longestSleep.score?.sleep_needed?.baseline_milli || 0;
          sleep.stage_summary = longestSleep.score?.stage_summary || {
            total_in_bed_time_milli: 0,
            total_awake_time_milli: 0,
            total_no_data_time_milli: 0,
            total_light_sleep_time_milli: 0,
            total_slow_wave_sleep_time_milli: 0,
            total_rem_sleep_time_milli: 0,
            sleep_cycle_count: 0,
            disturbance_count: 0,
          };
        }
      }
    }

    if (stress && strain) {
      performance = 1 - (stress + strain) / 2;
    } else if (stress || strain) {
      performance = stress || strain;
    }

    return {
      performance,
      stress,
      strain,
      sleep,
      restingHeartRate,
      maxHeartRate,
      dailyAvgHeartRate,
      hrv,
    };
  }
}
