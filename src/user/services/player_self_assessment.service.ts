import { Injectable } from '@nestjs/common';
import { PlayerSelfAssessment } from '../models/player_self_assessment.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import {
  GetPlayerSelfAssessmentsForDate,
  PlayerCreateSelfAssessmentRequest,
} from '../dtos/request.dtos';
import { PlayerStats } from '../models/player_stats.model';
import { Op } from 'sequelize';
import { DailyPoints } from '../models/daily_points.model';

@Injectable()
export class PlayerSelfAssessmentService {
  constructor(
    @InjectModel(PlayerSelfAssessment)
    private readonly playerSelfAssessmentModel: typeof PlayerSelfAssessment,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
    @InjectModel(DailyPoints)
    private readonly dailyPointsModel: typeof DailyPoints,
  ) {}

  async createSelfAssessment({
    firebase_id,
    score,
    assessment_type,
  }: PlayerCreateSelfAssessmentRequest) {
    const user = await this.userModel.findOne({
      where: { firebase_id: firebase_id },
      include: [
        {
          model: PlayerStats,
          required: true,
          include: [
            {
              model: PlayerSelfAssessment,
              as: 'self_assessments',
            },
          ],
        },
      ],
    });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.player_stats) {
      throw new Error('Player stats not found');
    }

    const data = {
      player_stats_id: user.player_stats.id,
      score: score,
      assessment_type: assessment_type,
      points_assigned: 20,
    } as PlayerSelfAssessment;

    console.log('data', data);

    const playerSelfAssessment =
      await this.playerSelfAssessmentModel.create(data);

    return playerSelfAssessment;
  }

  async getPlayerSelfAssessmentsForDate({
    firebase_id,
    date,
  }: GetPlayerSelfAssessmentsForDate) {
    if (!date) {
      date = new Date();
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const user = await this.userModel.findOne({
      where: { firebase_id: firebase_id },
      include: [
        {
          model: PlayerStats,
          include: [
            {
              model: PlayerSelfAssessment,
              as: 'self_assessments',
              required: false,
              where: {
                created_at: {
                  [Op.between]: [startDate, endDate],
                },
              },
            },
          ],
        },
      ],
    });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.player_stats) {
      return user.player_stats.self_assessments || [];
    }

    return [];
  }
}
