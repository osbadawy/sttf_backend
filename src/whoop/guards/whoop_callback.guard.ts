import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { HttpService } from '@nestjs/axios';
import { OAuthStateService } from './oauth_state_service.guard';
import { WhoopCallbackRequest } from '../dtos/whoop_request.dto';
import { WhoopTokenResponse } from '../dtos/whoop_user.dto';
import { WhoopUserResponse } from '../dtos/whoop_user.dto';
import { WhoopUserProfile } from '../dtos/whoop_user.dto';
import { WhoopAccess } from '../models/whoop_access.model';
import { CryptoUtil } from 'src/utils';
import { firstValueFrom } from 'rxjs';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class WhoopCallbackGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    private readonly oauthStateService: OAuthStateService,
    @InjectModel(WhoopAccess)
    private readonly whoopAccessModel: typeof WhoopAccess,
    private readonly cryptoUtil: CryptoUtil,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<WhoopCallbackRequest>();
    const state = req.query.state!;
    const { user_id, redirect_url, whoop_access_id } =
      this.oauthStateService.consumeState(state);
    if (!user_id || !redirect_url || !whoop_access_id) {
      throw new UnauthorizedException('Invalid state');
    }

    req.redirect_url = redirect_url;

    await this.exchangeCodeForToken(req, user_id, whoop_access_id);
    await this.getUserFromWhoop(req);

    return true;
  }

  private async exchangeCodeForToken(
    req: WhoopCallbackRequest,
    firebase_user_id: string,
    whoop_access_id: number,
  ): Promise<boolean> {
    try {
      // Get credentials from database
      const whoopAccess = await this.whoopAccessModel.findByPk(whoop_access_id);
      if (!whoopAccess) {
        throw new UnauthorizedException('Whoop access credentials not found');
      }

      const client_id = this.cryptoUtil.simpleDecrypt(
        whoopAccess.client_id_encrypted,
      );
      const client_secret = this.cryptoUtil.simpleDecrypt(
        whoopAccess.client_secret_encrypted,
      );
      const code = req.query.code;

      if (!code) {
        throw new UnauthorizedException(
          'Authorization code is missing. Query: ' + JSON.stringify(req.query),
        );
      }

      // Make request to WHOOP token endpoint
      const tokenResponse = await firstValueFrom(
        this.httpService.post<WhoopTokenResponse>(
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

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

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
        whoop_access_id: whoop_access_id,
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
      this.httpService.get<WhoopUserResponse>(
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
