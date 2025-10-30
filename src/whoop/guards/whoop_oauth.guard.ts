import {
  Injectable,
  ExecutionContext,
  CanActivate,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OAuthStateService } from './oauth_state_service.guard';
import * as crypto from 'crypto';
import type { Response, Request } from 'express';
import { WhoopOAuthRequest } from '../dtos/whoop_request.dto';
import { WhoopAccess } from '../models/whoop_access.model';
import { WhoopUser } from '../models/whoop_user.model';
import { CryptoUtil } from 'src/utils';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class WhoopOAuthGuard implements CanActivate {
  constructor(
    private readonly oauthStateService: OAuthStateService,
    @InjectModel(WhoopAccess)
    private readonly whoopAccessModel: typeof WhoopAccess,
    @InjectModel(WhoopUser)
    private readonly whoopUserModel: typeof WhoopUser,
    private readonly cryptoUtil: CryptoUtil,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<WhoopOAuthRequest & Request>();
    const url = req.url;
    const queryString = url.split('?')[1] || '';
    const params = new URLSearchParams(queryString);

    const state = crypto.randomBytes(8).toString('hex');
    if (!params.get('redirect_url') || params.get('redirect_url') === null) {
      throw new UnauthorizedException('Missing redirect_url');
    }

    // Find whoop_access with fewest users
    const whoopAccessWithLeastUsers =
      await this.findWhoopAccessWithLeastUsers();
    if (!whoopAccessWithLeastUsers) {
      throw new BadRequestException('No Whoop access credentials configured');
    }

    // Store state with whoop_access_id
    this.oauthStateService.setState(
      state,
      req.user.uid,
      params.get('redirect_url')!,
      whoopAccessWithLeastUsers.id,
    );

    // Decrypt client_id
    const clientId = this.cryptoUtil.simpleDecrypt(
      whoopAccessWithLeastUsers.client_id_encrypted,
    );

    // Redirect to WHOOP authorization URL
    const authUrl = this.buildAuthorizationUrl(state, clientId);
    const res = context.switchToHttp().getResponse<Response>();
    res.redirect(authUrl);
    return false;
  }

  private async findWhoopAccessWithLeastUsers(): Promise<WhoopAccess | null> {
    // Get all whoop_access records with user counts
    const whoopAccesses = await this.whoopAccessModel.findAll({
      include: [
        {
          model: WhoopUser,
          as: 'users',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        'id',
        'client_id_encrypted',
        'client_secret_encrypted',
        [Sequelize.fn('COUNT', Sequelize.col('users.id')), 'user_count'],
      ],
      group: [
        'WhoopAccess.id',
        'WhoopAccess.client_id_encrypted',
        'WhoopAccess.client_secret_encrypted',
      ],
      order: [[Sequelize.fn('COUNT', Sequelize.col('users.id')), 'ASC']],
    });

    return whoopAccesses.length > 0 ? whoopAccesses[0] : null;
  }

  private buildAuthorizationUrl(state: string, clientId: string): string {
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
      client_id: clientId,
      scope: scope,
      state: state,
    });

    return `${process.env.WHOOP_AUTHORIZE_URL}?${params.toString()}`;
  }
}
