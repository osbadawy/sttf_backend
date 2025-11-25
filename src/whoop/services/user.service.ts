import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhoopUser } from 'src/whoop/models';
import { User } from 'src/user/models/user.model';
import { CryptoUtil } from 'src/utils';
import {
  CreateWhoopUserParams,
  WhoopTokenResponse,
  DateRangeSummary,
} from 'src/whoop/dtos';
import { WhoopCycleService, WhoopSleepService, WhoopRecoveryService } from './';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WhoopAccess } from 'src/whoop/models/whoop_access.model';

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
    private readonly httpService: HttpService,
    @InjectModel(WhoopAccess)
    private readonly whoopAccessModel: typeof WhoopAccess,
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
    whoop_access_id,
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
      whoop_access_id: whoop_access_id,
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

  async getSummaryForDateRange(
    firebase_id: string,
    lastDay: Date,
    days: number,
  ): Promise<DateRangeSummary> {
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

  /**
   * Utility method to refresh a Whoop access token.
   * Can be used by guards, services, or any other component that needs to refresh tokens.
   *
   * @param refresh_token - The refresh token to use for getting a new access token
   * @param user_id - The user ID (UUID) to update in the database
   * @param whoop_access_id - The WhoopAccess ID to get OAuth credentials from
   * @returns The new access token string
   */
  async refreshWhoopAccessToken(
    refresh_token: string,
    user_id: string,
    whoop_access_id: number,
  ): Promise<string> {
    // Get credentials from database
    const whoopAccess = await this.whoopAccessModel.findByPk(whoop_access_id);
    if (!whoopAccess) {
      throw new Error('Whoop access credentials not found');
    }

    const client_id = this.cryptoUtil.simpleDecrypt(
      whoopAccess.client_id_encrypted,
    );
    const client_secret = this.cryptoUtil.simpleDecrypt(
      whoopAccess.client_secret_encrypted,
    );

    const response = await firstValueFrom(
      this.httpService.post<WhoopTokenResponse>(
        process.env.WHOOP_TOKEN_URL!,
        {
          grant_type: 'refresh_token',
          refresh_token: refresh_token,
          client_id: client_id,
          client_secret: client_secret,
          scope:
            'read:profile read:body_measurement read:cycles read:workout read:sleep read:recovery offline',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    // Update the whoopUser with new tokens
    await this.createWhoopUser({
      id: response.data.user_id,
      user_filter: { id: user_id },
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      scope: response.data.scope,
      expires_at: new Date(Date.now() + response.data.expires_in * 1000),
      whoop_access_id: whoop_access_id,
    });

    return response.data.access_token;
  }

  async revokeWhoopUserAccess(whoopUser: WhoopUser): Promise<void> {
    try {
      let access_token = this.cryptoUtil.simpleDecrypt(
        whoopUser.access_token_encrypted,
      );

      // Check if token is valid (not expired or expiring within 5 minutes)
      const now = new Date();
      if (
        !whoopUser.expires_at ||
        whoopUser.expires_at < new Date(now.getTime() + 5 * 60 * 1000)
      ) {
        // Token is expired or about to expire, refresh it
        const refresh_token = this.cryptoUtil.simpleDecrypt(
          whoopUser.refresh_token_encrypted,
        );
        access_token = await this.refreshWhoopAccessToken(
          refresh_token,
          whoopUser.user_id,
          whoopUser.whoop_access_id,
        );
      }

      // Make DELETE request to revoke access with valid token
      await firstValueFrom(
        this.httpService.delete(
          'https://api.prod.whoop.com/developer/v2/user/access',
          {
            headers: { Authorization: `Bearer ${access_token}` },
          },
        ),
      );
    } catch (error) {
      console.error('Error revoking Whoop user access:', error);
      // Don't throw - we still want to delete the local record even if API call fails
      // Log the error but continue with deletion
    }
  }
}
