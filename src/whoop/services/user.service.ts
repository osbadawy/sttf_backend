import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhoopUser } from 'src/whoop/models';
import { User } from 'src/user/models/user.model';
import { CryptoUtil } from 'src/utils';
import { CreateWhoopUserParams } from 'src/whoop/dtos';
import { WhoopCycleService, WhoopSleepService, WhoopRecoveryService } from './';

@Injectable()
export class WhoopUserService {
  constructor(
    private readonly cryptoUtil: CryptoUtil,
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @Inject(forwardRef(() => WhoopSleepService))
    private readonly whoopSleepService: WhoopSleepService,
    @Inject(forwardRef(() => WhoopRecoveryService))
    private readonly whoopRecoveryService: WhoopRecoveryService,
    @Inject(forwardRef(() => WhoopCycleService))
    private readonly whoopCycleService: WhoopCycleService,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async getWhoopUser(firebase_id: string) {
    const user = await this.userModel.findOne({
      where: { firebase_id },
      include: [
        {
          model: this.whoopUserModel,
          as: 'whoop_user',
          attributes: ['id', 'email', 'first_name', 'last_name'],
        },
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getAllWhoopUsers() {
    return await this.whoopUserModel.findAll();
  }

  async createWhoopUser({
    id,
    user_filter,
    email,
    first_name,
    last_name,
    access_token,
    refresh_token,
    scope,
    expires_at,
  }: CreateWhoopUserParams) {
    const user = await this.userModel.findOne({
      where: user_filter,
    });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.display_name) {
      user.display_name = `${first_name} ${last_name}`;
      await user.save();
    }

    const encryptedAccessToken = this.cryptoUtil.simpleEncrypt(access_token);
    const encryptedRefreshToken = this.cryptoUtil.simpleEncrypt(refresh_token);

    const whoopUserData = {
      id: id,
      user_id: user.id as string,
      access_token_encrypted: encryptedAccessToken,
      refresh_token_encrypted: encryptedRefreshToken,
      scope: scope,
      expires_at: expires_at,
    } as WhoopUser;

    if (email) {
      whoopUserData.email = email;
    }
    if (first_name) {
      whoopUserData.first_name = first_name;
    }
    if (last_name) {
      whoopUserData.last_name = last_name;
    }

    // Check if WhoopUser record exists for this user
    const existingWhoopUser = await this.whoopUserModel.findOne({
      where: { user_id: user.id },
    });

    if (existingWhoopUser) {
      // Update existing record
      await this.whoopUserModel.update(whoopUserData, {
        where: { user_id: user.id },
      });
    } else {
      // Create new record
      await this.whoopUserModel.create(whoopUserData);
    }

    return { ok: true };
  }

  private daySummaryFilter(startDate: Date, endDate: Date): object {
    const sleepFilter = this.whoopSleepService.sleepFilter();
    const recoveryFilter = this.whoopRecoveryService.recoveryFilter();
    const cycleFilter = this.whoopCycleService.cycleFilter(
      sleepFilter,
      recoveryFilter,
      startDate,
      endDate,
    );

    return {
      include: [
        {
          model: this.whoopUserModel,
          as: 'whoop_user',
          required: false,
          include: [cycleFilter],
          attributes: ['email', 'first_name', 'last_name', 'user_id'],
          order: [['start', 'DESC']],
        },
      ],
    };
  }

  private async getSummaryForDateRange(
    firebase_id: string,
    lastDay: Date,
    days: number,
  ) {
    const lastDayCopy = new Date(lastDay); // clone to avoid mutation

    const startDate = new Date(lastDayCopy);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(lastDay);
    endDate.setHours(23, 59, 59, 999);

    const user = await this.userModel.findOne({
      where: { firebase_id },
      ...this.daySummaryFilter(startDate, endDate),
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.whoop_user) {
      return {};
    }

    const dayCycles = this.whoopCycleService.getDayCycles(
      user.whoop_user.cycles || [],
      endDate,
      days,
    );
    const daySummary = {};

    for (const key of Object.keys(dayCycles)) {
      daySummary[key] = this.whoopCycleService.extractCycleData(dayCycles[key]);
    }

    return daySummary;
  }

  async getDaySummary(firebase_id: string, day: Date) {
    return await this.getSummaryForDateRange(firebase_id, new Date(day), 1);
  }

  async getAllPlayersDaySummary(day: Date) {
    day = new Date(day);
    const startDay = new Date(day.setHours(0, 0, 0, 0));
    const endDay = new Date(day.setHours(23, 59, 59, 999));

    const players = await this.userModel.findAll({
      where: {
        access: 'player',
      },
      ...this.daySummaryFilter(startDay, endDay),
    });

    return players;
  }

  async getMultiDaysSummary(firebase_id: string, days: number) {
    const results = await this.getSummaryForDateRange(
      firebase_id,
      new Date(),
      days,
    );

    return results;
  }
}
