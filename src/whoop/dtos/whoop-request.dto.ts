import { WhoopTokens } from './whoop-tokens.dto';
import { WhoopUserProfile } from './whoop-user-profile.dto';

export interface WhoopRequest {
  whoopTokens?: WhoopTokens;
}

export interface WhoopCallbackRequest {
  query: { code?: string; state?: string; error?: string };
  whoopTokens?: WhoopTokens;
  whoopUserProfile?: WhoopUserProfile;
}
