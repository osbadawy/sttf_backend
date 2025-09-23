import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhoopUser } from 'src/whoop/models';
import { User } from 'src/user/models/user.model';
import { CryptoUtil } from 'src/utils';
import { CreateWhoopUserParams } from 'src/whoop/dtos';
import {
  WhoopWorkoutService,
  WhoopCycleService,
  WhoopSleepService,
  WhoopRecoveryService,
} from './';

@Injectable()
export class WhoopUserService {
  constructor(
    private readonly cryptoUtil: CryptoUtil,
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @Inject(forwardRef(() => WhoopWorkoutService))
    private readonly whoopWorkoutService: WhoopWorkoutService,
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

    return {
      whoop_user: user.whoop_user,
    };
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

  async getDaySummary(firebase_id: string, day: Date) {
    day = new Date(day);
    const startDay = new Date(day.setHours(0, 0, 0, 0));
    const endDay = new Date(day.setHours(23, 59, 59, 999));

    const sleepFilter = this.whoopSleepService.sleepFilter();
    const recoveryFilter = this.whoopRecoveryService.recoveryFilter();
    const cycleFilter = this.whoopCycleService.cycleFilter(
      sleepFilter,
      recoveryFilter,
      startDay,
      endDay,
    );

    const workoutFilter = this.whoopWorkoutService.workoutFilter(
      startDay,
      endDay,
    );
    const user = await this.userModel.findOne({
      where: { firebase_id },
      include: [
        {
          model: this.whoopUserModel,
          as: 'whoop_user',
          required: true,
          include: [workoutFilter, cycleFilter],
          attributes: ['email', 'first_name', 'last_name', 'user_id'],
        },
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
