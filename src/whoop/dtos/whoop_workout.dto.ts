export interface WhoopWorkoutZoneDurations {
  zone_zero_milli: number;
  zone_one_milli: number;
  zone_two_milli: number;
  zone_three_milli: number;
  zone_four_milli: number;
  zone_five_milli: number;
}

export interface WhoopWorkoutScore {
  strain: number;
  average_heart_rate: number;
  max_heart_rate: number;
  kilojoule: number;
  percent_recorded: number;
  distance_meter?: number | null;
  altitude_gain_meter?: number | null;
  altitude_change_meter?: number | null;
  zone_durations?: WhoopWorkoutZoneDurations;
}

export interface WhoopWorkoutApiData {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_name: string;
  score_state: string;
  score?: WhoopWorkoutScore;
}

export interface WhoopWorkoutApiResponse {
  records: WhoopWorkoutApiData[];
  next_token: string | null;
}

export interface WhoopWorkoutDatabaseData {
  id: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  start: Date;
  end: Date;
  timezone_offset: string;
  sport_name: string;
  score_state: string;
  score?: {
    id: number;
    workout_id: string;
    strain?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    kilojoule?: number;
    percent_recorded?: number;
    distance_meter?: number | null;
    altitude_gain_meter?: number | null;
    altitude_change_meter?: number | null;
    zone_durations?: WhoopWorkoutZoneDurations;
  } | null;
}

export interface WhoopWorkoutServiceResponse {
  ok: boolean;
  message: string;
  data: {
    saved_workout_records: number;
    workout_records: WhoopWorkoutDatabaseData[];
  };
}
