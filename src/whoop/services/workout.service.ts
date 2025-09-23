import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Transaction, Sequelize, Op } from 'sequelize';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { WhoopWorkout } from 'src/whoop/models/workout.model';
import { WhoopWorkoutScore } from 'src/whoop/models/workout_score.model';
import { WhoopWorkoutZoneDurations } from 'src/whoop/models/workout_zone_durations.model';
import { CryptoUtil } from 'src/utils';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  WhoopWorkoutData,
  WhoopWorkoutApiResponse,
  WhoopWorkoutDataWithIds,
  WhoopWorkoutServiceResponse,
} from '../dtos';
import { User } from 'src/user/models/user.model';

@Injectable()
export class WhoopWorkoutService {
  constructor(
    private readonly cryptoUtil: CryptoUtil,
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @InjectModel(WhoopWorkout)
    private readonly whoopWorkoutModel: typeof WhoopWorkout,
    @InjectModel(WhoopWorkoutScore)
    private readonly whoopWorkoutScoreModel: typeof WhoopWorkoutScore,
    @InjectModel(WhoopWorkoutZoneDurations)
    private readonly whoopWorkoutZoneDurationsModel: typeof WhoopWorkoutZoneDurations,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly httpService: HttpService,
  ) {}

  async getSingleWorkoutFromWhoopApi(
    access_token: string,
    workout_id: string,
  ): Promise<WhoopWorkoutData> {
    const url = `https://api.prod.whoop.com/developer/v2/activity/workout/${workout_id}`;
    const response = await firstValueFrom(
      this.httpService.get<WhoopWorkoutData>(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    );
    return response.data;
  }

  private async getWorkoutsFromWhoopApi(
    access_token: string,
    next_token: string | null,
  ): Promise<WhoopWorkoutApiResponse> {
    let url = `https://api.prod.whoop.com/developer/v2/activity/workout`;
    if (next_token) {
      url += `?next_token=${next_token}`;
    }

    const response = await firstValueFrom(
      this.httpService.get<WhoopWorkoutApiResponse>(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    );
    return response.data;
  }

  private async saveSingleWorkoutRecord(
    workoutRecord: WhoopWorkoutData,
    whoopUserId: number,
    transaction: Transaction,
  ): Promise<WhoopWorkoutDataWithIds> {
    console.log(
      `Processing workout record ${workoutRecord.id}, score_state: ${workoutRecord.score_state}`,
    );

    // Upsert workout record
    const [workout] = await this.whoopWorkoutModel.upsert(
      {
        id: workoutRecord.id,
        user_id: whoopUserId,
        created_at: new Date(workoutRecord.created_at),
        updated_at: new Date(workoutRecord.updated_at),
        start: new Date(workoutRecord.start),
        end: new Date(workoutRecord.end),
        timezone_offset: workoutRecord.timezone_offset,
        sport_name: workoutRecord.sport_name,
        score_state: workoutRecord.score_state,
      } as WhoopWorkout,
      { transaction },
    );

    // Initialize score data
    let score: WhoopWorkoutScore | null = null;
    let zoneDurations: WhoopWorkoutZoneDurations | null = null;

    // Process score data if available
    if (workoutRecord.score_state === 'SCORED' && workoutRecord.score) {
      const [savedScore, created] =
        await this.whoopWorkoutScoreModel.findOrCreate({
          where: { workout_id: workout.id },
          defaults: {
            workout_id: workout.id,
            strain: workoutRecord.score.strain,
            average_heart_rate: workoutRecord.score.average_heart_rate,
            max_heart_rate: workoutRecord.score.max_heart_rate,
            kilojoule: workoutRecord.score.kilojoule,
            percent_recorded: workoutRecord.score.percent_recorded,
            distance_meter: workoutRecord.score.distance_meter,
            altitude_gain_meter: workoutRecord.score.altitude_gain_meter,
            altitude_change_meter: workoutRecord.score.altitude_change_meter,
          } as WhoopWorkoutScore,
          transaction,
        });

      // Update if it already existed
      if (!created) {
        await savedScore.update(
          {
            strain: workoutRecord.score.strain,
            average_heart_rate: workoutRecord.score.average_heart_rate,
            max_heart_rate: workoutRecord.score.max_heart_rate,
            kilojoule: workoutRecord.score.kilojoule,
            percent_recorded: workoutRecord.score.percent_recorded,
            distance_meter: workoutRecord.score.distance_meter,
            altitude_gain_meter: workoutRecord.score.altitude_gain_meter,
            altitude_change_meter: workoutRecord.score.altitude_change_meter,
          },
          { transaction },
        );
      }

      score = savedScore;

      // Save zone durations if available
      if (workoutRecord.score.zone_durations) {
        // Find existing zone durations or create new one
        const existingZoneDurations =
          await this.whoopWorkoutZoneDurationsModel.findOne({
            where: { workout_score_id: score.id },
            transaction,
          });

        if (existingZoneDurations) {
          // Update existing zone durations
          await existingZoneDurations.update(
            {
              zone_zero_milli:
                workoutRecord.score.zone_durations.zone_zero_milli,
              zone_one_milli: workoutRecord.score.zone_durations.zone_one_milli,
              zone_two_milli: workoutRecord.score.zone_durations.zone_two_milli,
              zone_three_milli:
                workoutRecord.score.zone_durations.zone_three_milli,
              zone_four_milli:
                workoutRecord.score.zone_durations.zone_four_milli,
              zone_five_milli:
                workoutRecord.score.zone_durations.zone_five_milli,
            },
            { transaction },
          );
          zoneDurations = existingZoneDurations;
        } else {
          // Create new zone durations
          zoneDurations = await this.whoopWorkoutZoneDurationsModel.create(
            {
              workout_score_id: score.id,
              zone_zero_milli:
                workoutRecord.score.zone_durations.zone_zero_milli,
              zone_one_milli: workoutRecord.score.zone_durations.zone_one_milli,
              zone_two_milli: workoutRecord.score.zone_durations.zone_two_milli,
              zone_three_milli:
                workoutRecord.score.zone_durations.zone_three_milli,
              zone_four_milli:
                workoutRecord.score.zone_durations.zone_four_milli,
              zone_five_milli:
                workoutRecord.score.zone_durations.zone_five_milli,
            } as any,
            { transaction },
          );
        }
      }
    }

    // Build the complete workout record with score data
    const workoutWithScore: WhoopWorkoutDataWithIds = {
      ...workout.toJSON(),
      score: score
        ? {
            id: score.id,
            workout_id: score.workout_id,
            strain: score.strain,
            average_heart_rate: score.average_heart_rate,
            max_heart_rate: score.max_heart_rate,
            kilojoule: score.kilojoule,
            percent_recorded: score.percent_recorded,
            distance_meter: score.distance_meter,
            altitude_gain_meter: score.altitude_gain_meter,
            altitude_change_meter: score.altitude_change_meter,
            zone_durations: zoneDurations
              ? {
                  zone_zero_milli: zoneDurations.zone_zero_milli,
                  zone_one_milli: zoneDurations.zone_one_milli,
                  zone_two_milli: zoneDurations.zone_two_milli,
                  zone_three_milli: zoneDurations.zone_three_milli,
                  zone_four_milli: zoneDurations.zone_four_milli,
                  zone_five_milli: zoneDurations.zone_five_milli,
                }
              : undefined,
          }
        : undefined,
    };

    return workoutWithScore;
  }

  async saveWorkoutsToDatabase(
    workoutsData: WhoopWorkoutData[],
    whoopUserId: number,
  ): Promise<{
    savedWorkouts: WhoopWorkoutDataWithIds[];
    allWorkoutsWorked: boolean;
  }> {
    const savedWorkouts: WhoopWorkoutDataWithIds[] = [];
    let allWorkoutsWorked = true;
    let processedCount = 0;
    console.log(
      `Starting to save ${workoutsData.length} workout records to database`,
    );

    for (const workoutRecord of workoutsData) {
      processedCount++;

      // Create a transaction for each workout record
      const transaction = await this.sequelize.transaction();

      try {
        const workoutWithScore = await this.saveSingleWorkoutRecord(
          workoutRecord,
          whoopUserId,
          transaction,
        );

        // Commit the transaction
        await transaction.commit();
        savedWorkouts.push(workoutWithScore);
        console.log(
          `Successfully processed workout record ${workoutRecord.id}`,
        );
      } catch (error) {
        allWorkoutsWorked = false;
        // Rollback the transaction on error
        await transaction.rollback();
        console.error(
          `Error saving workout record ${workoutRecord.id}:`,
          error,
        );
        // Continue with other workout records even if one fails
      }
    }

    console.log(
      `Successfully saved ${savedWorkouts.length} workout records to database`,
    );
    console.log(
      `Processed ${processedCount} out of ${workoutsData.length} total records from API`,
    );
    return {
      savedWorkouts,
      allWorkoutsWorked,
    };
  }

  async createWorkout(
    whoop_user_id: number,
    max_pages: number = 10,
  ): Promise<WhoopWorkoutServiceResponse> {
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

    let allSavedWorkouts: WhoopWorkoutDataWithIds[] = [];

    try {
      let next_token: string | null = null;
      for (let i = 0; i < max_pages; i++) {
        const workoutsResponse = await this.getWorkoutsFromWhoopApi(
          access_token,
          next_token,
        );

        next_token = workoutsResponse.next_token;

        const { savedWorkouts, allWorkoutsWorked } =
          await this.saveWorkoutsToDatabase(
            workoutsResponse.records,
            whoop_user_id,
          );

        allSavedWorkouts = allSavedWorkouts.concat(savedWorkouts);

        if (!allWorkoutsWorked || !next_token) {
          break;
        }
      }

      return {
        ok: true,
        message: `Successfully processed ${allSavedWorkouts.length} workout records`,
        data: {
          num_records_saved: allSavedWorkouts.length,
          records: allSavedWorkouts,
        },
      };
    } catch (error) {
      console.error('Error fetching or saving workout data:', error);
      throw new Error('Failed to fetch or save workout data from Whoop API');
    }
  }

  async getMultiDayData(
    firebase_id: string,
    days: number = 14,
  ): Promise<WhoopWorkoutDataWithIds[]> {
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
          model: this.whoopWorkoutModel,
          as: 'workouts',
          required: false,
          where: {
            start: {
              [Op.gte]: min_date,
            },
          },
          order: [['start', 'DESC']],
          include: [
            {
              model: this.whoopWorkoutScoreModel,
              as: 'score',
              required: false,
              include: [
                {
                  model: this.whoopWorkoutZoneDurationsModel,
                  as: 'zoneDurations',
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!whoopUser) {
      throw new Error('User or Whoop user not found');
    }

    return whoopUser.workouts || [];
  }

  workoutFilter(startDay: Date, endDay: Date): object {
    return {
      model: this.whoopWorkoutModel,
      as: 'workouts',
      required: false,
      where: {
        start: {
          [Op.lte]: endDay,
        },
        end: {
          [Op.gte]: startDay,
        },
      },
      include: [
        {
          model: this.whoopWorkoutScoreModel,
          as: 'score',
          required: false,
          include: [
            {
              model: this.whoopWorkoutZoneDurationsModel,
              as: 'zoneDurations',
              required: false,
            },
          ],
        },
      ],
      order: [['start', 'DESC']],
    };
  }
}
