import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Response, Request } from 'express';
import type { WhoopCallbackRequest, WhoopUserProfile } from './dtos';
import * as crypto from 'crypto';

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
