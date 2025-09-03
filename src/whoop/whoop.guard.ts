import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhoopOAuthGuard implements CanActivate {
  constructor(private readonly httpService: HttpService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ 
      user: { uid: string }, 
    }>();
    
    // Redirect to WHOOP authorization URL
    const authUrl = this.buildAuthorizationUrl(req.user.uid);
    const res = context.switchToHttp().getResponse();
    res.redirect(authUrl);
    return false;
  }

  private buildAuthorizationUrl(state: string): string {
    const client_id = process.env.WHOOP_CLIENT_ID;
    const scope = ['read:profile', 'read:body_measurement', 'read:cycles', 'read:workout', 'read:sleep', 'read:recovery', 'offline'].join(' ');
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

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ query: { code?: string, state?: string, error?: string } }>();
    return await this.exchangeCodeForToken(req);

  }

  private async exchangeCodeForToken(req: any): Promise<boolean> {
    try {
      const client_id = process.env.WHOOP_CLIENT_ID;
      const client_secret = process.env.WHOOP_CLIENT_SECRET;
      const code = req.query.code;
      const user_id = req.query.state;

      if (!code) {
        throw new UnauthorizedException('Authorization code is missing');
      }

      // Make request to WHOOP token endpoint
      const tokenResponse = await firstValueFrom(
        this.httpService.post(process.env.WHOOP_TOKEN_URL!, {
          grant_type: 'authorization_code',
          client_id: client_id,
          client_secret: client_secret,
          code: code,
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Store tokens in request for use in the controller
      req.whoopTokens = {
        access_token,
        refresh_token,
        expires_in,
        expires_at: Date.now() + (expires_in * 1000),
        authorization_token: code,
        user_id,
      };

      return true;

    } catch (error) {
      console.error('OAuth token exchange failed:', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to exchange authorization code for tokens');
    }
  }
}