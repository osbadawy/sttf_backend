export type SignUpBodyRequest = {
  firebase_id: string;
  email: string;
};

export type getUserPkRequest = {
  id: string;
};

export type PatchUserFieldsRequest = {
  email?: string;
  avatar_url?: string;
  age?: number;
  phone?: number;
  nationality?: string;
  display_name?: string;
};

export type PatchUserBodyRequest = {
  id: string;
  data?: PatchUserFieldsRequest;
} & PatchUserFieldsRequest;
