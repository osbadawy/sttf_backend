// whoop.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';

@Injectable()
export class WhoopStrategy extends PassportStrategy(Strategy, 'whoop') {
  constructor() {
    // Log environment variables for debugging
    console.log('WHOOP Strategy Config:');
    console.log('AUTHORIZE_URL:', process.env.WHOOP_AUTHORIZE_URL);
    console.log('TOKEN_URL:', process.env.WHOOP_TOKEN_URL);
    console.log('CLIENT_ID:', process.env.WHOOP_CLIENT_ID);
    console.log('CLIENT_SECRET:', process.env.WHOOP_CLIENT_SECRET ? 'Set' : 'Missing');

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
    req: { query: { scope: string; state: string; error?: string; error_description?: string } },
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) {
    console.log('WHOOP Strategy validate called!');
    console.log('Request query:', req.query);
    console.log('Access token received:', accessToken ? 'Yes' : 'No');
    console.log('Refresh token received:', refreshToken ? 'Yes' : 'No');
    console.log('Profile:', profile);

    // Check for OAuth errors
    if (req.query.error) {
      console.error('OAuth Error:', req.query.error);
      console.error('Error Description:', req.query.error_description);
      return done(new Error(`OAuth Error: ${req.query.error} - ${req.query.error_description}`), false);
    }

    if (!accessToken) {
      console.error('No access token received');
      return done(new Error('No access token received'), false);
    }

    const whoopAccount = {
      accessToken,
      refreshToken,
      scope: req.query.scope,
      state: req.query.state,
    };

    console.log('Returning whoop account:', whoopAccount);

    return done(null, {
      whoop: whoopAccount,
    });
  }
}
