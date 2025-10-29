import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BodyComposition } from '../models/body_composition.model';
import { User } from '../models/user.model';
import { PlayerStats } from '../models/player_stats.model';
import {
  CreateBodyCompositionRequest,
  GetBodyCompositionsQuery,
} from '../dtos/request.dtos';

@Injectable()
export class BodyCompositionService {
  constructor(
    @InjectModel(BodyComposition)
    private readonly bodyCompositionModel: typeof BodyComposition,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async getLatestBodyCompositionValues(firebase_id: string) {
    const user = await this.userModel.findOne({
      where: { firebase_id },
      include: [
        {
          model: PlayerStats,
          include: [
            {
              model: BodyComposition,
              order: [['createdAt', 'DESC']],
            },
          ],
        },
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.player_stats) {
      throw new Error('Player stats not found for user');
    }

    const bodyCompositions = user.player_stats.body_compositions || [];

    if (bodyCompositions.length === 0) {
      return {
        bmi: null,
        body_fat_percentage: null,
        muscle_mass_percentage: null,
        weight_kg: null,
      };
    }

    const latestBmi =
      bodyCompositions.find((bc) => bc.bmi !== null)?.bmi ?? null;
    const latestBodyFatPercentage =
      bodyCompositions.find((bc) => bc.body_fat_percentage !== null)
        ?.body_fat_percentage ?? null;
    const latestMuscleMassPercentage =
      bodyCompositions.find((bc) => bc.muscle_mass_percentage !== null)
        ?.muscle_mass_percentage ?? null;
    const latestWeightKg =
      bodyCompositions.find((bc) => bc.weight_kg !== null)?.weight_kg ?? null;

    return {
      bmi: latestBmi,
      body_fat_percentage: latestBodyFatPercentage,
      muscle_mass_percentage: latestMuscleMassPercentage,
      weight_kg: latestWeightKg,
    };
  }

  async getBodyCompositions({ firebase_id, limit }: GetBodyCompositionsQuery) {
    const user = await this.userModel.findOne({
      where: { firebase_id },
      include: [
        {
          model: PlayerStats,
          include: [
            {
              model: BodyComposition,
              required: false,
              limit: limit,
              order: [['createdAt', 'DESC']],
            },
          ],
        },
      ],
    });
    return user?.player_stats?.body_compositions || [];
  }

  async createBodyComposition({
    firebase_id,
    weight_kg,
    body_fat_percentage,
    muscle_mass_percentage,
  }: CreateBodyCompositionRequest) {
    const user = await this.userModel.findOne({
      where: { firebase_id },
      include: [
        {
          model: PlayerStats,
          required: true,
        },
      ],
    });

    if (!user || !user.player_stats) {
      throw new Error('User not found');
    }

    let bmi: number | undefined;
    if (user.player_stats.height_cm && weight_kg) {
      const height_m = user.player_stats.height_cm / 100;
      bmi = weight_kg / height_m ** 2;
    }

    const bodyComposition = await this.bodyCompositionModel.create({
      player_stats_id: user.player_stats?.id,
      weight_kg: weight_kg,
      bmi: bmi,
      body_fat_percentage: body_fat_percentage,
      muscle_mass_percentage: muscle_mass_percentage,
    } as BodyComposition);
    return bodyComposition;
  }
}
