export type bodyCompositionResponse = {
  ok: boolean;
  data: {
    id: string;
    player_stats_id: string;
    weight: string;
    bmi: string;
    body_fat_percentage: string;
    muscle_mass_percentage: string;
  };
};

export type deleteBodyCompositionResponse = {
  ok: boolean;
  data: { id: string };
};
