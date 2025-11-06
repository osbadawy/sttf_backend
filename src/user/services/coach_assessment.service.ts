import { Injectable } from '@nestjs/common';
import { PlayerSelfAssessment } from '../models/player_self_assessment.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { GetCoachAssessmentsForDate } from '../dtos/request.dtos';
import { PlayerStats } from '../models/player_stats.model';
import { Op } from 'sequelize';
import { DailyPointsService } from './daily_points.service';
import { CoachAssessment } from '../models/coach_assessment.model';
import { CoachAssessmentRequest } from '../dtos/request.dtos';
@Injectable()
export class CoachAssessmentService {
  constructor(
    @InjectModel(CoachAssessment)
    private readonly coachAssessmentModel: typeof CoachAssessment,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly dailyPointsService: DailyPointsService,
  ) {}

  async createCoachAssessment(
    { fitness_score, readiness_score }: CoachAssessmentRequest,
    firebase_id: string,
  ) {
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

    const points_assigned = 50 * fitness_score + 50 * readiness_score;

    const data = {
      player_stats_id: user.player_stats.id,
      fitness_score: fitness_score,
      readiness_score: readiness_score,
      points_assigned: points_assigned,
    } as CoachAssessment;

    console.log('data', data);

    const coachAssessment = await this.coachAssessmentModel.create(data);

    // Update daily points for self assessment
    try {
      await this.dailyPointsService.updateDailyPointsForUser(
        firebase_id,
        20,
        new Date(),
      );
      console.log(
        `Updated daily points for self assessment: +${data.points_assigned} points`,
      );
    } catch (error) {
      console.error(
        `Failed to update daily points for self assessment:`,
        error,
      );
      // Don't throw error to avoid breaking the main workflow
    }

    return coachAssessment;
  }

  async getCoachAssessmentsForDate({
    firebase_id,
    date,
  }: GetCoachAssessmentsForDate) {
    if (!date) {
      date = new Date();
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    console.log({ date, startDate, endDate });

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
                createdAt: {
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
