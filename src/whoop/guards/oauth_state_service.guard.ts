import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuthState } from '../dtos/whoop_user.dto';

@Injectable()
export class OAuthStateService {
  private states = new Map<string, OAuthState>();

  // Save state
  setState(
    state: string,
    user_id: string,
    redirect_url: string,
    whoop_access_id: number,
  ) {
    this.states.set(state, {
      user_id,
      redirect_url,
      whoop_access_id,
    });
  }

  // Retrieve & remove state
  consumeState(state: string): {
    user_id: string;
    redirect_url: string;
    whoop_access_id: number;
  } {
    const entry = this.states.get(state);

    if (!entry) throw new UnauthorizedException('Invalid state');

    this.states.delete(state); // one-time use
    return {
      user_id: entry.user_id,
      redirect_url: entry.redirect_url,
      whoop_access_id: entry.whoop_access_id,
    };
  }
}
