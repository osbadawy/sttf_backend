export interface WhoopUserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WhoopTokens {
  authorization_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: Date;
  firebase_id: string;
  scope: string;
}

export interface CreateWhoopUserParams {
  whoopTokens: WhoopTokens;
  whoopUserProfile: WhoopUserProfile;
}
