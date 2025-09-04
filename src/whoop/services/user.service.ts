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
    whoopTokens,
    whoopUserProfile,
  }: CreateWhoopUserParams) {
    const user = await this.userModel.findOne({
      where: { firebase_id: whoopTokens.firebase_id },
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Encrypt the tokens before storing
    const encryptedAuthorizationToken = this.cryptoUtil.simpleEncrypt(
      whoopTokens.authorization_token,
    );
    const encryptedAccessToken = this.cryptoUtil.simpleEncrypt(
      whoopTokens.access_token,
    );
    const encryptedRefreshToken = this.cryptoUtil.simpleEncrypt(
      whoopTokens.refresh_token,
    );

    const whoopUserData = {
      id: whoopUserProfile.user_id,
      user_id: user.id as string,
      email: whoopUserProfile.email,
      first_name: whoopUserProfile.first_name,
      last_name: whoopUserProfile.last_name,
      authorization_token_encrypted: encryptedAuthorizationToken,
      access_token_encrypted: encryptedAccessToken,
      refresh_token_encrypted: encryptedRefreshToken,
      scope: whoopTokens.scope,
      expires_at: whoopTokens.expires_at,
    };

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
}
