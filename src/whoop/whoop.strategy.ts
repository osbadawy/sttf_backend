// whoop.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';


@Injectable()
export class WhoopStrategy extends PassportStrategy(Strategy, 'whoop') {
  constructor() {
    super({
      authorizationURL: process.env.WHOOP_AUTHORIZE_URL!,
      tokenURL: process.env.WHOOP_TOKEN_URL!,
      clientID: process.env.WHOOP_CLIENT_ID!,
      clientSecret: process.env.WHOOP_CLIENT_SECRET!,
      callbackURL: process.env.WHOOP_REDIRECT_WEB!,
      scope: ['offline'],
      passReqToCallback: true,
    });
  }

  // Passport calls this after exchanging code → token
  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    params: any,
    profile: any,
    done: Function,
  ) {
    // params may contain expires_in, token_type, scope
    const userId = req.user?.id || 'demo-user'; // pull from session/jwt

    const whoopAccount = {
      userId,
      accessToken,
      refreshToken,
      expiresIn: params.expires_in,
      scope: params.scope,
    };

    // store in DB here, or emit to a service
    done(null, whoopAccount);
  }
}
