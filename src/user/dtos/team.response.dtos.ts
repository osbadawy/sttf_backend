export interface getAndPostTeamResponse {
  ok: boolean;
  data: {
    id: string;
    team: string;
    image: string;
    totalPlayers: number;
  };
}
