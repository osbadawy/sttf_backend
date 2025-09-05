import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Transaction, Sequelize } from 'sequelize';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { User } from 'src/user/models/user.model';
import { WhoopCycle } from 'src/whoop/models/cycle.model';
import { WhoopCycleScore } from 'src/whoop/models/cycle_score.model';
import { CryptoUtil } from 'src/utils';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  WhoopCycleApiData,
  WhoopCycleApiResponse,
  WhoopCycleDatabaseData,
  WhoopCycleServiceResponse,
} from '../dtos';

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
    cycleRecord: WhoopCycleApiData,
    whoopUserId: number,
    transaction: Transaction,
  ): Promise<WhoopCycleDatabaseData> {
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
    const cycleWithScore: WhoopCycleDatabaseData = {
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
        : null,
    };

    return cycleWithScore;
  }

  private async saveCyclesToDatabase(
    cyclesData: WhoopCycleApiData[],
    whoopUserId: number,
  ): Promise<{
    savedCycles: WhoopCycleDatabaseData[];
    allCyclesWorked: boolean;
  }> {
    const savedCycles: WhoopCycleDatabaseData[] = [];
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

    let allSavedCycles: WhoopCycleDatabaseData[] = [];

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
          saved_cycle_records: allSavedCycles.length,
          cycle_records: allSavedCycles,
        },
      };
    } catch (error) {
      console.error('Error fetching or saving cycle data:', error);
      throw new Error('Failed to fetch or save cycle data from Whoop API');
    }
  }
}
