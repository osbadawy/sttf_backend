import { Injectable } from '@nestjs/common';
import { PlayerSelfAssessment } from '../models/player_self_assessment.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { PlayerCreateSelfAssessmentRequest } from '../dtos/request.dtos';
import { PlayerStats } from '../models/player_stats.model';


@Injectable()
export class PlayerSelfAssessmentService {
  constructor(
    @InjectModel(PlayerSelfAssessment)
    private readonly playerSelfAssessmentModel: typeof PlayerSelfAssessment,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
  ) {}

  async createSelfAssessment(body: PlayerCreateSelfAssessmentRequest) {
    const user = await this.userModel.findOne({
      where: { firebase_id: body.firebase_id },
      include: [
        {
          model: PlayerStats,
          as: 'player_stats',
        },
      ],
    });
    if (!user) {
      throw new Error('User not found');
    }

    let playerStats = user.player_stats;

    if (!playerStats) {
      playerStats = await this.playerStatsModel.create({
        user_id: user.id as string,
      } as PlayerStats);
    }

    const data = {
        player_stats_id: playerStats.id,
        score: body.score,
        assessment_type: body.assessment_type,
      } as PlayerSelfAssessment

      console.log('data', data);

    const playerSelfAssessment = await this.playerSelfAssessmentModel.create(data);

    return playerSelfAssessment;
  }

}