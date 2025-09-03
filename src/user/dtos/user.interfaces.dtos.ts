export interface SignUpResponse {
  created: boolean;
  user: {
    firebase_id: string;
    email: string;
  };
}

export interface getUserResponse {
  ok: boolean;
  data: {
    email: string;
    avatar_url: string;
    age: number;
    phone: number;
    nationality: string;
    display_name: string;
  };
}
