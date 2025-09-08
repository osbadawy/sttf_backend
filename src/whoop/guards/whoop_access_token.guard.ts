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

import { WhoopAccessSession, WhoopTokenResponse } from '../dtos/whoop_user.dto';

/**
#1 if session.whoop_access_token exists, use session to get access token information
#2 if session does not exist, use the database to get access token information
#3 if session is invalid, get new access token from OAuth Endpoint
*/
@Injectable()
export class WhoopAccessTokenGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(WhoopUser) private readonly whoopUserModel: typeof WhoopUser,
    @InjectModel(User) private readonly userModel: typeof User,
    @Inject(WhoopUserService)
    private readonly whoopUserService: WhoopUserService,
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user: { uid: string };
      session: Record<string, unknown>;
    }>();

    const session = req.session;
    delete session.whoop_access;
    const access = await this.getAccessFromSession(session, req.user.uid);

    const now = new Date();

    // If access token expires less than 5 minuts from now
    if (access && access.expires_at < new Date(now.getTime() + 5 * 60 * 1000)) {
      await this.refreshAccessToken(access, session, req.user.uid);
    }

    return true;
  }

  async getAccessFromSession(
    session: Record<string, unknown>,
    firebase_user_id: string,
  ): Promise<WhoopAccessSession | null> {
    if (session.whoop_access && _isWhoopAccessSession(session.whoop_access)) {
      return session.whoop_access;
    } else {
      return await this.getAccessFromDatabase(firebase_user_id, session);
    }

    function _isWhoopAccessSession(obj: unknown): obj is WhoopAccessSession {
      if (typeof obj !== 'object' || obj === null) {
        return false;
      }

      const candidate = obj as Record<string, unknown>;

      return (
        'access_token' in candidate &&
        'refresh_token' in candidate &&
        'expires_at' in candidate &&
        'scope' in candidate &&
        typeof candidate.access_token === 'string' &&
        typeof candidate.refresh_token === 'string' &&
        candidate.expires_at instanceof Date &&
        typeof candidate.scope === 'string'
      );
    }
  }

  async getAccessFromDatabase(
    firebase_id: string,
    session: Record<string, unknown>,
  ): Promise<WhoopAccessSession | null> {
    const user = await this.userModel.findOne({
      where: { firebase_id },
      include: [
        {
          model: this.whoopUserModel,
          as: 'whoop_user',
        },
      ],
    });

    if (!user || !user.whoop_user) {
      throw new Error('Whoop user not found');
    }

    const access_token = this.cryptoUtil.simpleDecrypt(
      user.whoop_user.access_token_encrypted,
    );
    const refresh_token = this.cryptoUtil.simpleDecrypt(
      user.whoop_user.refresh_token_encrypted,
    );
    const expires_at = user.whoop_user.expires_at;
    const scope = user.whoop_user.scope;

    const whoopAccess: WhoopAccessSession = {
      access_token,
      refresh_token,
      expires_at,
      scope,
    };

    session.whoop_access = whoopAccess;
    return whoopAccess;
  }

  async refreshAccessToken(
    access: WhoopAccessSession,
    session: Record<string, unknown>,
    firebase_id: string,
  ): Promise<void> {
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

      const whoopAccess: WhoopAccessSession = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: new Date(Date.now() + response.data.expires_in * 1000),
        scope: response.data.scope,
      };

      session.whoop_access = whoopAccess;

      await this.whoopUserService.createWhoopUser({
        id: response.data.user_id,
        firebase_user_id: firebase_id,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        scope: response.data.scope,
        expires_at: new Date(Date.now() + response.data.expires_in * 1000),
      });
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }
}
