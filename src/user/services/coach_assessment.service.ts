import { Injectable } from '@nestjs/common';
import { PlayerSelfAssessment } from '../models/player_self_assessment.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import {
  GetCoachAssessmentsForDate,
  GetCoachAssessmentsForAllPlayersOnDayQuery,
} from '../dtos/request.dtos';
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
    { firebase_id, fitness_score, readiness_score }: CoachAssessmentRequest,
    assigned_by: string,
  ) {
    const user = await this.userModel.findOne({
      where: { firebase_id: firebase_id },
      include: [
        {
          model: PlayerStats,
          required: true,
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
      assigned_by: assigned_by,
      day: new Date(),
    } as CoachAssessment;

    const transaction =
      await this.coachAssessmentModel.sequelize!.transaction();

    try {
      const coachAssessment = await this.coachAssessmentModel.create(data, {
        transaction,
      });

      // Update daily points for coach assessment
      await this.dailyPointsService.updateDailyPointsForUser(
        firebase_id,
        points_assigned,
        new Date(),
        transaction,
      );
      console.log(
        `Updated daily points for coach assessment: +${points_assigned} points`,
      );

      await transaction.commit();
      return coachAssessment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
                day: {
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

  async getCoachAssessmentsForAllPlayersOnDay({
    day,
  }: GetCoachAssessmentsForAllPlayersOnDayQuery) {
    const startDay = new Date(day);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(day);
    endDay.setHours(23, 59, 59, 999);

    const users = await this.userModel.findAll({
      where: {
        access: 'player',
      },
      include: [
        {
          model: PlayerStats,
          required: true,
          include: [
            {
              model: CoachAssessment,
              required: true,
              where: {
                day: {
                  [Op.between]: [startDay, endDay],
                },
              },
            },
          ],
        },
      ],
    });

    return users;
  }
}
