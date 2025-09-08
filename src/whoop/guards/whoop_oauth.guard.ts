import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { OAuthStateService } from './oauth_state_service.guard';
import * as crypto from 'crypto';
import type { Response } from 'express';

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
