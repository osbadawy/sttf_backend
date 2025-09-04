import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhoopUser } from 'src/whoop/models/whoop_user.model';
import { User } from 'src/user/models/user.model';
import { WhoopCycle } from 'src/whoop/models/cycle.model';
import { WhoopCycleScore } from 'src/whoop/models/cycle_score.model';
import { CryptoUtil } from 'src/utils';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface WhoopCycleApiData {
  id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end?: string;
  timezone_offset: string;
  score_state: string;
  score?: {
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  };
}

interface WhoopApiResponse {
  records: WhoopCycleApiData[];
  next_token: string | null;
}

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
    private readonly httpService: HttpService,
  ) {}

  private async getAllCyclesFromWhoopApi(
    access_token: string,
    max_pages: number = 10,
  ): Promise<WhoopApiResponse> {
    let allCycles: WhoopCycleApiData[] = [];
    let nextToken: string | null = null;
    let hasMoreData = true;
    let page = 0;
    console.log(`Fetching cycles from Whoop API, max_pages: ${max_pages}`);

    // Fetch all pages of cycles data
    while (hasMoreData && page < max_pages) {
      const url = nextToken
        ? `https://api.prod.whoop.com/developer/v2/cycle?next_token=${nextToken}`
        : `https://api.prod.whoop.com/developer/v2/cycle`;

      const response = await firstValueFrom(
        this.httpService.get<WhoopApiResponse>(url, {
          headers: { Authorization: `Bearer ${access_token}` },
        }),
      );

      const responseData: WhoopApiResponse = response.data;
      if (responseData && responseData.records) {
        allCycles = allCycles.concat(responseData.records);
      }
      nextToken = (responseData && responseData.next_token) || null;
      hasMoreData = nextToken !== null;
      page++;
    }

    console.log(`Fetched ${allCycles.length} total cycles from Whoop API`);

    return {
      records: allCycles,
      next_token: null, // We've fetched everything
    };
  }

  private async saveCyclesToDatabase(
    cyclesData: WhoopCycleApiData[],
    whoopUserId: number,
  ) {
    const savedCycles: Array<{
      id: number;
      user_id: number;
      created_at: Date;
      updated_at: Date;
      start: Date;
      end?: Date | null | undefined;
      timezone_offset: string;
      score_state: string;
      score: {
        cycle_id: number;
        strain?: number;
        kilojoule?: number;
        average_heart_rate?: number;
        max_heart_rate?: number;
      } | null;
    }> = [];

    for (const cycleData of cyclesData) {
      try {
        // Check if cycle already exists
        const existingCycle = await this.whoopCycleModel.findOne({
          where: { id: cycleData.id },
        });

        const cycleDataToSave = {
          id: cycleData.id,
          user_id: whoopUserId,
          created_at: new Date(cycleData.created_at),
          updated_at: new Date(cycleData.updated_at),
          start: new Date(cycleData.start),
          end: cycleData.end ? new Date(cycleData.end) : undefined,
          timezone_offset: cycleData.timezone_offset,
          score_state: cycleData.score_state,
        };

        let cycle: WhoopCycle;
        if (existingCycle) {
          // Update existing cycle
          await this.whoopCycleModel.update(cycleDataToSave, {
            where: { id: cycleData.id },
          });
          cycle = (await this.whoopCycleModel.findByPk(
            cycleData.id,
          )) as WhoopCycle;
        } else {
          // Create new cycle
          cycle = await this.whoopCycleModel.create(
            cycleDataToSave as WhoopCycle,
          );
        }

        // Save cycle score if it exists
        let score: WhoopCycleScore | null = null;
        if (cycleData.score) {
          const scoreData = {
            cycle_id: cycle.id,
            strain: cycleData.score.strain,
            kilojoule: cycleData.score.kilojoule,
            average_heart_rate: cycleData.score.average_heart_rate,
            max_heart_rate: cycleData.score.max_heart_rate,
          };

          // Check if score already exists
          const existingScore = await this.whoopCycleScoreModel.findOne({
            where: { cycle_id: cycle.id },
          });

          if (existingScore) {
            // Update existing score
            await this.whoopCycleScoreModel.update(scoreData, {
              where: { cycle_id: cycle.id },
            });
            score = (await this.whoopCycleScoreModel.findOne({
              where: { cycle_id: cycle.id },
            })) as WhoopCycleScore;
          } else {
            // Create new score
            score = await this.whoopCycleScoreModel.create(scoreData as any);
          }
        }

        // Add score to cycle data
        const cycleWithScore = {
          ...cycle.toJSON(),
          score: score ? score.toJSON() : null,
        };

        savedCycles.push(cycleWithScore);
      } catch (error) {
        console.error(`Error saving cycle ${cycleData.id}:`, error);
        // Continue with other cycles even if one fails
      }
    }

    console.log(`Successfully saved ${savedCycles.length} cycles to database`);
    return savedCycles;
  }

  async createCycles(whoop_user_id: number) {
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
      // Fetch cycles from Whoop API
      const cyclesResponse = await this.getAllCyclesFromWhoopApi(access_token);

      // Save cycles to database
      const savedCycles = await this.saveCyclesToDatabase(
        cyclesResponse.records,
        whoop_user_id,
      );

      return {
        ok: true,
        message: `Successfully processed ${savedCycles.length} cycles`,
        data: {
          total_cycles: cyclesResponse.records.length,
          saved_cycles: savedCycles.length,
          cycles: savedCycles,
        },
      };
    } catch (error) {
      console.error('Error fetching or saving cycles:', error);
      throw new Error('Failed to fetch or save cycles from Whoop API');
    }
  }
}
