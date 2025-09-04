export type getTeamPkRequest = {
  id: string;
};

export type postTeamPkRequest = {
  team: string;
};

export type PatchTeamFieldsRequest = {
  team?: string;
  metadata?: Record<string, unknown> | null;
  totalPlayers?: number;
  image?: string | null;
};

export type PatchTeamBodyRequest = {
  id: string;
  data?: PatchTeamFieldsRequest;
} & PatchTeamFieldsRequest;
