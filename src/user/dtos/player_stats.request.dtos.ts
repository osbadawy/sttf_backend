export type GetByIdRequest = { id: string };

export type CreatePlayerStatsRequest = {
  user_id: string;
  [key: string]: any; // allow optional fields to future-proof
};

export  type PatchFields = { [key: string]: any };
export  type PatchBodyRequest = { id: string; data?: PatchFields } & PatchFields;