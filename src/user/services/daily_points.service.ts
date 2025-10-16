import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { PlayerStats } from '../models/player_stats.model';
import { DailyPoints } from '../models/daily_points.model';
import { WhoopUser } from '../../whoop/models/whoop_user.model';
import { Transaction } from 'sequelize';

@Injectable()
export class DailyPointsService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
    @InjectModel(DailyPoints)
    private readonly dailyPointsModel: typeof DailyPoints,
    @InjectModel(WhoopUser)
    private readonly whoopUserModel: typeof WhoopUser,
  ) {}

  async updateOrCreateDailyPoints(
    firebase_id: string,
    points: number,
    day: Date,
    transaction?: Transaction,
  ): Promise<DailyPoints> {
    console.log(
      `Updating daily points for firebase_id: ${firebase_id}, points: ${points}, day: ${day.toISOString()}`,
    );

    // day should only be the date, not the time
    const dayDate = new Date(day);
    dayDate.setHours(0, 0, 0, 0);

    //Find user and dailypoints object (don't use transaction for User lookup to avoid isolation issues)
    let user = await this.userModel.findOne({
      where: { firebase_id },
      include: [
        {
          model: PlayerStats,
          required: false, // Make this optional so we can find users without PlayerStats
        },
      ],
    });

    // If user not found, wait a bit and try again (in case of transaction isolation issues)
    if (!user) {
      console.log(
        `User not found on first attempt, waiting 100ms and retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      user = await this.userModel.findOne({
        where: { firebase_id },
        include: [
          {
            model: PlayerStats,
            required: false,
          },
        ],
      });
    }

    if (!user) {
      console.error(
        `User not found for firebase_id: ${firebase_id} after retry`,
      );
      throw new Error('User not found');
    }

    if (!user.player_stats) {
      console.log(
        `Player stats not found for firebase_id: ${firebase_id}, creating PlayerStats...`,
      );
      // Create PlayerStats if they don't exist
      const playerStats = await this.ensurePlayerStatsExists(
        user.id,
        transaction,
      );
      user.player_stats = playerStats;
    }

    // Now check for existing DailyPoints for this day
    const existingDailyPoints = await this.dailyPointsModel.findOne({
      where: {
        player_stats_id: user.player_stats.id,
        day: dayDate,
      },
      transaction,
    });

    if (!existingDailyPoints) {
      console.log(
        `Creating new daily points record for firebase_id: ${firebase_id}, day: ${dayDate.toISOString()}`,
      );
      return await this.dailyPointsModel.create(
        {
          player_stats_id: user.player_stats.id,
          points: points,
          day: dayDate,
        } as DailyPoints,
        { transaction },
      );
    } else {
      console.log(
        `Updating existing daily points record for firebase_id: ${firebase_id}, current points: ${existingDailyPoints.points}, adding: ${points}`,
      );
      existingDailyPoints.points = existingDailyPoints.points + points;
      return await existingDailyPoints.save({ transaction });
    }
  }

  /**
   * Ensure PlayerStats exists for a user, create if missing
   */
  async ensurePlayerStatsExists(
    userId: string,
    transaction?: Transaction,
  ): Promise<PlayerStats> {
    // Don't use transaction for lookup to avoid isolation issues
    let playerStats = await this.playerStatsModel.findOne({
      where: { user_id: userId },
    });

    if (!playerStats) {
      console.log(`Creating PlayerStats for user_id: ${userId}`);
      playerStats = await this.playerStatsModel.create(
        {
          user_id: userId,
        } as PlayerStats,
        { transaction },
      );
      console.log(`Created PlayerStats with id: ${playerStats.id}`);
    }

    return playerStats;
  }

  /**
   * Get firebase_id from whoop_user_id
   */
  async getFirebaseIdFromWhoopUserId(whoopUserId: number): Promise<string> {
    console.log(`Looking up firebase_id for whoop_user_id: ${whoopUserId}`);

    const whoopUser = await this.whoopUserModel.findOne({
      where: { id: whoopUserId },
    });

    if (!whoopUser) {
      console.error(`Whoop user not found for whoop_user_id: ${whoopUserId}`);
      throw new Error(`Whoop user not found for whoop_user_id: ${whoopUserId}`);
    }

    console.log(`Found WhoopUser with user_id: ${whoopUser.user_id}`);

    const user = await this.userModel.findOne({
      where: { id: whoopUser.user_id },
      attributes: ['firebase_id'],
    });

    if (!user) {
      console.error(
        `User not found for user_id: ${whoopUser.user_id} (from whoop_user_id: ${whoopUserId})`,
      );
      throw new Error(
        `User not found for user_id: ${whoopUser.user_id} (from whoop_user_id: ${whoopUserId})`,
      );
    }

    console.log(`Found User with firebase_id: ${user.firebase_id}`);
    return user.firebase_id;
  }

  /**
   * Update daily points for a user by firebase_id
   */
  async updateDailyPointsForUser(
    firebase_id: string,
    points: number,
    day: Date,
    transaction?: Transaction,
  ): Promise<DailyPoints> {
    return this.updateOrCreateDailyPoints(
      firebase_id,
      points,
      day,
      transaction,
    );
  }

  /**
   * Update daily points for a user by whoop_user_id
   */
  async updateDailyPointsForWhoopUser(
    whoopUserId: number,
    points: number,
    day: Date,
    transaction?: Transaction,
  ): Promise<DailyPoints> {
    const firebase_id = await this.getFirebaseIdFromWhoopUserId(whoopUserId);

    // Ensure PlayerStats exists for this user (don't use transaction for User lookup)
    const user = await this.userModel.findOne({
      where: { firebase_id },
    });

    if (user) {
      await this.ensurePlayerStatsExists(user.id, transaction);
    }

    return this.updateOrCreateDailyPoints(
      firebase_id,
      points,
      day,
      transaction,
    );
  }
}
