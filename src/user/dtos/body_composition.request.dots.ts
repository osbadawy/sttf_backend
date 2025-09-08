export type postBodyCompositionRequest = {
  player_stats_id: string;
  weight?: string | number;
  bmi?: string | number;
  body_fat_percentage?: string | number;
  muscle_mass_percentage?: string | number;
};

export type patchBodyCompositionRequest = {
  id: string;
  data?: {
    weight?: string | number;
    bmi?: string | number;
    body_fat_percentage?: string | number;
    muscle_mass_percentage?: string | number;
  };
} & {
  weight?: string | number;
  bmi?: string | number;
  body_fat_percentage?: string | number;
  muscle_mass_percentage?: string | number;
};
