import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhoopAuth } from './models/whoop_auth.model';
import { User } from '../user/models/user.model';
import { CryptoUtil } from '../utils';

interface CreateWhoopAuthParams {
    authorization_token: string;
    access_token: string;
    refresh_token: string;
    expires_at: Date;
    firebase_id: string;
    scope: string;
}

@Injectable()
export class WhoopService {
    private readonly cryptoUtil = new CryptoUtil();

    constructor(
        @InjectModel(WhoopAuth) private readonly whoopAuthModel: typeof WhoopAuth,
        @InjectModel(User) private readonly userModel: typeof User
    ) {}

    async createWhoopAuth({ authorization_token, access_token, refresh_token, expires_at, firebase_id, scope }: CreateWhoopAuthParams) {
        const user = await this.userModel.findOne({ where: { firebase_id } });
        if (!user) {
            throw new Error('User not found');
        }

        // Encrypt the tokens before storing
        const encryptedAuthorizationToken = this.cryptoUtil.simpleEncrypt(authorization_token);
        const encryptedAccessToken = this.cryptoUtil.simpleEncrypt(access_token);
        const encryptedRefreshToken = this.cryptoUtil.simpleEncrypt(refresh_token);

        const whoopAuthData = {
            user_id: user.id as string,
            authorization_token_encrypted: encryptedAuthorizationToken,
            access_token_encrypted: encryptedAccessToken,
            refresh_token_encrypted: encryptedRefreshToken,
            scope: scope,
            expires_at: expires_at,
        };

        // Check if WhoopAuth record exists for this user
        const existingWhoopAuth = await this.whoopAuthModel.findOne({
            where: { user_id: user.id }
        });

        if (existingWhoopAuth) {
            // Update existing record
            await this.whoopAuthModel.update(whoopAuthData, {
                where: { user_id: user.id }
            });
        } else {
            // Create new record
            await this.whoopAuthModel.create(whoopAuthData);
        }

        return { ok: true };
    }

}
