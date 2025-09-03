export interface SignUpResponse {
  created: boolean;
  user: {
    firebase_id: string;
    email: string;
  };
}