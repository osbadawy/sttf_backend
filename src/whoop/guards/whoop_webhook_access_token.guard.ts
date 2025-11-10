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
import { WhoopAccess } from '../models/whoop_access.model';
import { User } from 'src/user/models/user.model';
import { CryptoUtil } from 'src/utils';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

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
    @InjectModel(WhoopAccess)
    private readonly whoopAccessModel: typeof WhoopAccess,
    @InjectModel(User) private readonly userModel: typeof User,
    @Inject(WhoopUserService)
    private readonly whoopUserService: WhoopUserService,
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const { user_id: whoop_user_id } = req.body as { user_id: string };
    const { client_id } = req.params as { client_id: string };

    // Find whoop_access by unencrypted client_id
    const whoopAccessId = await this.findWhoopAccessByClientId(client_id);
    if (!whoopAccessId) {
      throw new Error('Invalid client_id');
    }

    // Get whoop user to validate
    const whoopUser = await this.whoopUserModel.findOne({
      where: { id: whoop_user_id },
    });

    if (!whoopUser) {
      throw new Error('Whoop user not found');
    }

    // Verify that the user belongs to this whoop_access
    if (String(whoopUser.whoop_access_id) !== String(whoopAccessId)) {
      throw new Error('User does not belong to this client');
    }

    // Verify signature using the whoop_access credentials
    // await this.verifySignature(req, whoopAccessId); //TODO: FIX verification. Currently not working.

    let access = await this.getAccessFromDatabase(whoop_user_id);

    const now = new Date();
    // If access token expires less than 5 minuts from now
    if (access && access.expires_at < new Date(now.getTime() + 5 * 60 * 1000)) {
      access = await this.refreshAccessToken(
        access,
        access.user_id,
        whoopAccessId,
      );
    }

    (req as Request & { whoop_access: WhoopAccessTokens }).whoop_access =
      access;

    return true;
  }

  private async findWhoopAccessByClientId(
    client_id: string,
  ): Promise<number | null> {
    // Get all whoop_access records
    const allWhoopAccesses = await this.whoopAccessModel.findAll();

    // Decrypt and compare each client_id
    for (const whoopAccess of allWhoopAccesses) {
      const decryptedClientId = this.cryptoUtil.simpleDecrypt(
        whoopAccess.client_id_encrypted,
      );

      if (decryptedClientId === client_id) {
        return whoopAccess.id;
      }
    }

    return null;
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
    whoop_access_id: number,
  ): Promise<WhoopAccessTokens> {
    const { refresh_token } = access;
    try {
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

      console.log('One');

      await this.whoopUserService.createWhoopUser({
        id: response.data.user_id,
        user_filter: { id: user_id },
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        scope: response.data.scope,
        expires_at: new Date(Date.now() + response.data.expires_in * 1000),
        whoop_access_id: whoop_access_id,
      });

      console.log('Two');

      const whoopAccessTokens: WhoopAccessTokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: new Date(Date.now() + response.data.expires_in * 1000),
        scope: response.data.scope,
        user_id: user_id,
      };

      console.log('Three');

      return whoopAccessTokens;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async verifySignature(req: Request, whoop_access_id: number) {
    if (
      !req.headers['x-whoop-signature'] ||
      !req.headers['x-whoop-signature-timestamp']
    ) {
      throw new Error(
        'Missing X-WHOOP-Signature or X-WHOOP-Signature-Timestamp',
      );
    }

    const signature = req.headers['x-whoop-signature'] as string;
    const signatureTimestamp = req.headers[
      'x-whoop-signature-timestamp'
    ] as string;

    // Get credentials from database
    const whoopAccess = await this.whoopAccessModel.findByPk(whoop_access_id);
    if (!whoopAccess) {
      throw new Error('Whoop access credentials not found');
    }

    const client_secret = this.cryptoUtil.simpleDecrypt(
      whoopAccess.client_secret_encrypted,
    );

    // calculated_signature_string = base64Encode(HMACSHA256(timestamp_header + raw_http_request_body, client_secret))
    const payload = signatureTimestamp + JSON.stringify(req.body);
    const calculatedSignatureString = this.cryptoUtil.hmac(
      payload,
      client_secret,
      'sha256',
      'base64',
    );

    if (signature !== calculatedSignatureString) {
      throw new Error('Invalid X-WHOOP-Signature');
    }
  }
}
