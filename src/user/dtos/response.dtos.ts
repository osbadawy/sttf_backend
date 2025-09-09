//////////////////////////////////////////////// BODY COMPOSITION //////////////////////////////////////////////////
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

//////////////////////////////////////////////// PLAYER STATS /////////////////////////////////////////////////////
export interface PlayerStatsResponse {
  ok: boolean;
  data: Record<string, any>;
}

//////////////////////////////////////////////// TEAM //////////////////////////////////////////////////////////////////
export interface getAndPostTeamResponse {
  ok: boolean;
  data: {
    id: string;
    team: string;
    image: string;
    totalPlayers: number;
  };
}

//////////////////////////////////////////////// USER ////////////////////////////////////////////////////////////////////
export interface SignUpResponse {
  created: boolean;
  user: {
    firebase_id: string;
    email: string;
    access:string;
  };
}

export interface getUserResponse {
  ok: boolean;
  data: {
    email: string;
    avatar_url: string;
    access: string;
    age: number;
    phone: number;
    nationality: string;
    display_name: string;
  };
}

//////////////////////////////////////////////////////// MEAL ////////////////////////////////////////////////////////////
export type mealResponse = {
  ok: boolean;
  data: {
    id: string;
    player_stats_id: string;
    is_recommended: boolean;
    food: string;
    recommended_time: string | null;
    consumed_at: string; // ISO
    calories: number | null;
  };
};

///////////////////////////////////////////////////// PLAYER SELF ASSESSMENT ///////////////////////////////////////////////////
export type playerSelfAssessmentResponse = {
  ok: boolean;
  data: {
    id: string;
    player_stats_id: string;
    tiredness_level: number;
    emotional_level: number;
    progress_achieved_level: number;
  };
};

////////////////////////////////////////////////////////// COACH ASSESSMENT ///////////////////////////////////////////////////////////
export type coachAssessmentResponse = {
  ok: boolean;
  data: {
    id: string;
    player_stats_id: string;
    satisfaction_of_training_level: number;
    progress_made_level: number;
    improvements_needed_level: number;
  };
};
