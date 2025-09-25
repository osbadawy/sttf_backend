import { Injectable } from "@nestjs/common";
import { PlayerActivity } from "../models/player_activity.model";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "../models/user.model";
import { WhoopWorkout } from "src/whoop/models";
import { Op } from "sequelize";

@Injectable()
export class PlayerActivityService {
  constructor(
    @InjectModel(PlayerActivity)
    private readonly playerActivityModel: typeof PlayerActivity,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(WhoopWorkout)
    private readonly whoopWorkoutModel: typeof WhoopWorkout,
  ) {}


  async getPlayerActivities(user_filter: Record<string, unknown>, start_date: Date, end_date: Date) {
    console.log(" start_date, end_date", start_date, end_date);

    const user = await this.userModel.findOne({
      where: user_filter,
      include: [
        {
          model: PlayerActivity,
          as: 'player_activities',
          where: {
            started_at: { 
              [Op.between]: [new Date(start_date), new Date(end_date)],
            },
          },
          order: [['started_at', 'DESC']],
          include: [
            {
              model: WhoopWorkout,
              as: 'workout',
            },
          ],
          required: false,
        },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user.player_activities;
  }

}
