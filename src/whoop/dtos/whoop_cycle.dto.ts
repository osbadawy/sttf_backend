export interface WhoopCycleScore {
  strain: number;
  kilojoule: number;
  average_heart_rate: number;
  max_heart_rate: number;
}

export interface WhoopCycleApiData {
  id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end?: string;
  timezone_offset: string;
  score_state: string;
  score?: WhoopCycleScore;
}

export interface WhoopCycleApiResponse {
  records: WhoopCycleApiData[];
  next_token: string | null;
}

export interface WhoopCycleDatabaseData {
  id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  start: Date;
  end?: Date | null;
  timezone_offset: string;
  score_state: string;
  score?: {
    id: number;
    cycle_id: number;
    strain?: number;
    kilojoule?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
  } | null;
}

export interface WhoopCycleServiceResponse {
  ok: boolean;
  message: string;
  data: {
    saved_cycle_records: number;
    cycle_records: WhoopCycleDatabaseData[];
  };
}
