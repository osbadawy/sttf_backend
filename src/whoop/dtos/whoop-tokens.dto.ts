export interface WhoopTokens {
  authorization_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: Date;
  user_id: string;
  scope: string;
}
