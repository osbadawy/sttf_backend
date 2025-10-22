import type { SelfAssessmentType } from '../models/player_self_assessment.model';

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

//////////////////////////////////////////////// USER ////////////////////////////////////////////////////////////////////
export interface SignUpResponse {
  created: boolean;
  user: {
    firebase_id: string;
    email: string;
    access: string;
  };
}

export interface getUserResponse {
  ok: boolean;
  data: {
    email: string;
    avatar_url?: string;
    access?: string;
    birth_date?: Date;
    phone?: string;
    nationality?: string;
    display_name?: string;
  };
}

///////////////////////////////////////////////////// PLAYER SELF ASSESSMENT ///////////////////////////////////////////////////
export type playerSelfAssessmentResponse = {
  ok: boolean;
  data: {
    id: string;
    player_stats_id: string;
    score?: number;
    assessment_type?: SelfAssessmentType;
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

////////////////////////////////////////////////////////// Player With Plans ///////////////////////////////////////////////////////////
export type playerWithPlansData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  readiness: number | null;
  meal: boolean;
  workout: boolean;
  nationality: string | null;
  photo_url: string | null;
};

export type playerWithPlansResponse = {
  ok: boolean;
  data: playerWithPlansData[];
};
