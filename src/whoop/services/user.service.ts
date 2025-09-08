import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhoopUser } from 'src/whoop/models';
import { User } from 'src/user/models/user.model';
import { CryptoUtil } from 'src/utils';
import { CreateWhoopUserParams } from 'src/whoop/dtos';

@Injectable()
export class WhoopUserService {
  private readonly cryptoUtil = new CryptoUtil();

  constructor(
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async createWhoopUser({
    id,
    firebase_user_id,
    email,
    first_name,
    last_name,
    access_token,
    refresh_token,
    scope,
    expires_at,
  }: CreateWhoopUserParams) {
    const user = await this.userModel.findOne({
      where: { firebase_id: firebase_user_id },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const encryptedAccessToken = this.cryptoUtil.simpleEncrypt(
      access_token,
    );
    const encryptedRefreshToken = this.cryptoUtil.simpleEncrypt(
      refresh_token,
    );

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
      await this.whoopUserModel.create(whoopUserData as WhoopUser);
    }

    return { ok: true };
  }
}
