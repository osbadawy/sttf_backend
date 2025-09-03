import { WhoopTokens } from './whoop-tokens.dto';

export interface WhoopRequest {
  whoopTokens?: WhoopTokens;
}

export interface WhoopCallbackRequest {
  query: { code?: string; state?: string; error?: string };
  whoopTokens?: WhoopTokens;
}
