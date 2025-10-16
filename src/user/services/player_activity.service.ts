import { Injectable } from '@nestjs/common';
import { PlayerActivity } from '../models/player_activity.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import {
  WhoopWorkout,
  WhoopWorkoutScore,
  WhoopWorkoutZoneDurations,
} from 'src/whoop/models';
import { Op } from 'sequelize';
import {
  CreatePlayerActivityRequest,
  CreateSelfAssessmentRequest,
} from '../dtos/request.dtos';

@Injectable()
export class PlayerActivityService {
  constructor(
    @InjectModel(PlayerActivity)
    private readonly playerActivityModel: typeof PlayerActivity,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async getPlayerActivityById(id: string) {
    return this.playerActivityModel.findByPk(id, {
      include: [
        {
          model: WhoopWorkout,
          as: 'workout',
          include: [
            {
              model: WhoopWorkoutScore,
              as: 'score',
              include: [
                {
                  model: WhoopWorkoutZoneDurations,
                  as: 'zoneDurations',
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async getPlayerActivities(
    user_filter: Record<string, unknown>,
    start_date: Date,
    end_date: Date,
  ) {
    console.log(' start_date, end_date', start_date, end_date);

    // First, find the user to get the user_id
    const user = await this.userModel.findOne({
      where: user_filter,
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Query PlayerActivities directly with proper associations
    const playerActivities = await this.playerActivityModel.findAll({
      where: {
        user_id: user.id,
        started_at: {
          [Op.between]: [new Date(start_date), new Date(end_date)],
        },
      },
      order: [['started_at', 'DESC']],
      include: [
        {
          model: WhoopWorkout,
          as: 'workout',
          required: false,
          include: [
            {
              model: WhoopWorkoutScore,
              as: 'score',
            },
          ],
        },
      ],
    });

    return playerActivities;
  }

  async createPlayerActivity(
    body: CreatePlayerActivityRequest,
  ): Promise<PlayerActivity> {
    // Find user by firebase_id
    const user = await this.userModel.findOne({
      where: { firebase_id: body.firebase_id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create the player activity
    const playerActivity = await this.playerActivityModel.create({
      user_id: user.id,
      activity_type: body.activity_type,
      started_at: new Date(body.started_at),
      ended_at: new Date(body.ended_at),
      points_assigned: 0,
    } as PlayerActivity);

    return playerActivity;
  }

  async createSelfAssessment(body: CreateSelfAssessmentRequest) {
    const playerActivity = await this.playerActivityModel.findByPk(
      body.player_activity_id,
    );
    if (!playerActivity) {
      throw new Error('Player activity not found');
    }
    playerActivity.self_assessment_score = body.self_assessment_score;
    playerActivity.points_assigned = 10;
    if (body.activity_type) {
      playerActivity.activity_type = body.activity_type;
    }
    await playerActivity.save();
    return playerActivity;
  }
}
