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
      scope: [
        'read:profile',
        'read:body_measurement',
        'read:cycles',
        'read:workout',
        'read:sleep',
        'read:recovery',
      ],
      passReqToCallback: true,
      state: 'Some String',
    });
  }

  // Passport calls this after exchanging code → token
  validate(
    req: { query: { scope: string; state: string } },
    accessToken: string,
  ) {
    const whoopAccount = {
      accessToken,
      scope: req.query.scope,
      state: req.query.state,
    };

    return whoopAccount;

    // store in DB here, or emit to a service
    // done(null, whoopAccount);
  }
}
