import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { WhoopUserService } from '../services/user.service';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/sequelize';
import { WhoopUser } from '../models/whoop_user.model';
import { User } from 'src/user/models/user.model';
import { CryptoUtil } from 'src/utils';
import { firstValueFrom } from 'rxjs';

import { WhoopAccessTokens, WhoopTokenResponse } from '../dtos/whoop_user.dto';

/**
#1 if session.whoop_access_token exists, use session to get access token information
#2 if session does not exist, use the database to get access token information
#3 if session is invalid, get new access token from OAuth Endpoint
*/
@Injectable()
export class WhoopWebhookAccessTokenGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @InjectModel(User) private readonly userModel: typeof User,
    @Inject(WhoopUserService)
    private readonly whoopUserService: WhoopUserService,
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    await this.verifySignature(req);

    const { user_id: whoop_user_id } = req.body;

    const access = await this.getAccessFromDatabase(whoop_user_id);

    const now = new Date();
    // If access token expires less than 5 minuts from now
    if (access && access.expires_at < new Date(now.getTime() + 5 * 60 * 1000)) {
      await this.refreshAccessToken(access, access.user_id);
    }

    // access = await this.refreshAccessToken(access!, access!.user_id);

    req.whoop_access = access;

    return true;
  }

  async getAccessFromDatabase(
    whoop_user_id: string,
  ): Promise<WhoopAccessTokens> {
    const whoopUser = await this.whoopUserModel.findOne({
      where: { id: whoop_user_id },
    });

    if (!whoopUser) {
      throw new Error('Whoop user not found');
    }

    const access_token = this.cryptoUtil.simpleDecrypt(
      whoopUser.access_token_encrypted,
    );
    const refresh_token = this.cryptoUtil.simpleDecrypt(
      whoopUser.refresh_token_encrypted,
    );
    const expires_at = whoopUser.expires_at;
    const scope = whoopUser.scope;

    const whoopAccess: WhoopAccessTokens = {
      access_token,
      refresh_token,
      expires_at,
      scope,
      user_id: whoopUser.user_id,
    };

    return whoopAccess;
  }

  async refreshAccessToken(
    access: WhoopAccessTokens,
    user_id: string,
  ): Promise<WhoopAccessTokens> {
    const { refresh_token } = access;
    try {
      const response = await firstValueFrom(
        this.httpService.post<WhoopTokenResponse>(
          process.env.WHOOP_TOKEN_URL!,
          {
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
            client_id: process.env.WHOOP_CLIENT_ID,
            client_secret: process.env.WHOOP_CLIENT_SECRET,
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

      console.log('One');

      await this.whoopUserService.createWhoopUser({
        id: response.data.user_id,
        user_filter: { id: user_id },
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        scope: response.data.scope,
        expires_at: new Date(Date.now() + response.data.expires_in * 1000),
      });

      console.log('Two');

      const whoopAccess: WhoopAccessTokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: new Date(Date.now() + response.data.expires_in * 1000),
        scope: response.data.scope,
        user_id: user_id,
      };

      console.log('Three');

      return whoopAccess;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async verifySignature(req: Request) {
    if (
      !req.headers['x-whoop-signature'] ||
      !req.headers['x-whoop-signature-timestamp']
    ) {
      throw new Error(
        'Missing X-WHOOP-Signature or X-WHOOP-Signature-Timestamp',
      );
    }

    const signature = req.headers['x-whoop-signature'];
    const signatureTimestamp = req.headers['x-whoop-signature-timestamp'];

    // calculated_signature_string = base64Encode(HMACSHA256(timestamp_header + raw_http_request_body, client_secret))
    const payload = signatureTimestamp + JSON.stringify(req.body);
    const calculatedSignatureString = this.cryptoUtil.hmac(
      payload,
      process.env.WHOOP_CLIENT_SECRET!,
      'sha256',
      'base64',
    );

    if (signature !== calculatedSignatureString) {
      throw new Error('Invalid X-WHOOP-Signature');
    }
  }
}
