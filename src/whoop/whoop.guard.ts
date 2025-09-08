import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Response, Request, } from 'express';
import type { WhoopCallbackRequest, WhoopUserProfile } from './dtos';
import * as crypto from 'crypto';
import { InjectModel } from '@nestjs/sequelize';
import { WhoopUser } from './models/';
import { User } from 'src/user/models/user.model';
import { CryptoUtil } from 'src/utils';
import { WhoopUserService } from './services/user.service';

interface OAuthState {
  user_id: string;
  platform: string;
}

@Injectable()
export class OAuthStateService {
  private states = new Map<string, OAuthState>();

  // Save state
  setState(state: string, user_id: string, platform: string) {
    this.states.set(state, {
      user_id,
      platform,
    });
  }

  // Retrieve & remove state
  consumeState(state: string): { user_id: string; platform: string } {
    const entry = this.states.get(state);

    if (!entry) throw new UnauthorizedException('Invalid state');

    this.states.delete(state); // one-time use
    return { user_id: entry.user_id, platform: entry.platform };
  }
}

@Injectable()
export class WhoopOAuthGuard implements CanActivate {
  constructor(private readonly oauthStateService: OAuthStateService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user: { uid: string };
      body: { platform: string };
    }>();

    const state = crypto.randomBytes(8).toString('hex');
    this.oauthStateService.setState(state, req.user.uid, req.body.platform);

    // Redirect to WHOOP authorization URL
    const authUrl = this.buildAuthorizationUrl(state);
    const res = context.switchToHttp().getResponse<Response>();
    res.redirect(authUrl);
    return false;
  }

  private buildAuthorizationUrl(state: string): string {
    const client_id = process.env.WHOOP_CLIENT_ID;
    const scope = [
      'read:profile',
      'read:body_measurement',
      'read:cycles',
      'read:workout',
      'read:sleep',
      'read:recovery',
      'offline',
    ].join(' ');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: client_id!,
      scope: scope,
      state: state,
    });

    return `${process.env.WHOOP_AUTHORIZE_URL}?${params.toString()}`;
  }
}

@Injectable()
export class WhoopCallbackGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    private readonly oauthStateService: OAuthStateService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<WhoopCallbackRequest>();
    const state = req.query.state!;
    const { user_id, platform } = this.oauthStateService.consumeState(state);
    if (!user_id || !platform) {
      throw new UnauthorizedException('Invalid state');
    }

    req.platform = platform;

    await this.exchangeCodeForToken(req, user_id);
    await this.getUserFromWhoop(req);

    return true;
  }

  private async exchangeCodeForToken(
    req: WhoopCallbackRequest,
    firebase_user_id: string,
  ): Promise<boolean> {
    try {
      const client_id = process.env.WHOOP_CLIENT_ID;
      const client_secret = process.env.WHOOP_CLIENT_SECRET;
      const code = req.query.code;

      if (!code) {
        throw new UnauthorizedException(
          'Authorization code is missing. Query: ' + JSON.stringify(req.query),
        );
      }

      // Make request to WHOOP token endpoint
      const tokenResponse = await firstValueFrom(
        this.httpService.post(
          process.env.WHOOP_TOKEN_URL!,
          {
            grant_type: 'authorization_code',
            client_id: client_id,
            client_secret: client_secret,
            code: code,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      const { access_token, refresh_token, expires_in } =
        tokenResponse.data as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };

      // Store tokens in request for use in the controller
      req.whoopTokens = {
        access_token,
        refresh_token,
        expires_in,
        expires_at: new Date(Date.now() + expires_in * 1000),
        authorization_token: code,
        firebase_id: firebase_user_id,
        scope:
          'read:profile read:body_measurement read:cycles read:workout read:sleep read:recovery offline',
      };

      return true;
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';

      if (error && typeof error === 'object') {
        if (
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response
        ) {
          errorMessage = String(error.response.data);
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }

      console.error('OAuth token exchange failed:', errorMessage);
      throw new UnauthorizedException(
        'Failed to exchange authorization code for tokens',
      );
    }
  }

  private async getUserFromWhoop(req: WhoopCallbackRequest): Promise<boolean> {
    if (!req.whoopTokens) {
      throw new UnauthorizedException('Whoop tokens are missing');
    }

    const { access_token } = req.whoopTokens;
    const userResponse = await firstValueFrom(
      this.httpService.get(
        'https://api.prod.whoop.com/developer/v2/user/profile/basic',
        {
          headers: { Authorization: `Bearer ${access_token}` },
          params: {
            access_token: access_token,
          },
        },
      ),
    );

    req.whoopUserProfile = userResponse.data as WhoopUserProfile;
    return true;
  }
}

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
    @Inject(WhoopUserService) private readonly whoopUserService: WhoopUserService,
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user: { uid: string };
      session: Record<string, any>;
    }>();

    const session = req.session;
    delete session.whoop_access;
    const access= await this.getAccessFromSession(session, req.user.uid);

    const now = new Date();

    // If access token expires less than 5 minuts from now
    if (access?.expires_at < new Date(now.getTime() + 5 * 60 * 1000)) {
      await this.refreshAccessToken(access, session, req.user.uid);
    }

    return true;
  }

  async getAccessFromSession(session: Record<string, any>, firebase_user_id: string): Promise<Record<string, any>> {
    if (session.whoop_access) {
      return session.whoop_access;
    } else {
      return await this.getAccessFromDatabase(firebase_user_id, session);
    }
  }

  async getAccessFromDatabase(firebase_id: string, session: Record<string, any>){
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

    const access_token = this.cryptoUtil.simpleDecrypt(user.whoop_user.access_token_encrypted);
    const refresh_token = this.cryptoUtil.simpleDecrypt(user.whoop_user.refresh_token_encrypted);
    const expires_at = user.whoop_user.expires_at;
    const scope = user.whoop_user.scope;

    session.whoop_access = {
      access_token,
      refresh_token,
      expires_at,
      scope,
    }

    return session.whoop_access;
  }

  async refreshAccessToken(access: Record<string, any>, session: Record<string, any>, firebase_id: string){
    const { refresh_token } = access;
    try {
    const response = await firstValueFrom(
      this.httpService.post(
        process.env.WHOOP_TOKEN_URL!,
        {
          grant_type: 'refresh_token',
          refresh_token: refresh_token,
          client_id: process.env.WHOOP_CLIENT_ID,
          client_secret: process.env.WHOOP_CLIENT_SECRET,
          scope: 'read:profile read:body_measurement read:cycles read:workout read:sleep read:recovery offline',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    session.whoop_access = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: new Date(Date.now() + response.data.expires_in * 1000),
      scope: response.data.scope,
    };

    this.whoopUserService.createWhoopUser({
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