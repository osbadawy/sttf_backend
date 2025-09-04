import { WhoopTokens, WhoopUserProfile } from './whoop_user.dto';

export interface WhoopRequest {
  whoopTokens?: WhoopTokens;
}

export interface WhoopCallbackRequest {
  query: { code?: string; state?: string; error?: string };
  whoopTokens?: WhoopTokens;
  whoopUserProfile?: WhoopUserProfile;
}
