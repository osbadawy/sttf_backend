import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Response } from 'express';
import type { WhoopCallbackRequest } from './dtos';

@Injectable()
export class WhoopOAuthGuard implements CanActivate {
  constructor(private readonly httpService: HttpService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user: { uid: string };
    }>();

    // Redirect to WHOOP authorization URL
    const authUrl = this.buildAuthorizationUrl(req.user.uid);
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
  constructor(private readonly httpService: HttpService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<WhoopCallbackRequest>();
    return await this.exchangeCodeForToken(req);
  }

  private async exchangeCodeForToken(
    req: WhoopCallbackRequest,
  ): Promise<boolean> {
    try {
      const client_id = process.env.WHOOP_CLIENT_ID;
      const client_secret = process.env.WHOOP_CLIENT_SECRET;
      const code = req.query.code;
      const user_id = req.query.state;

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
        user_id: user_id || '',
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
}
