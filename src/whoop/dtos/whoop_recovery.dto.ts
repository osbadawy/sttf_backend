export interface WhoopRecoveryScore {
  user_calibrating: boolean;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd_milli: number;
  spo2_percentage?: number | null;
  skin_temp_celsius?: number | null;
}

export interface WhoopRecoveryApiData {
  id: number;
  cycle_id: number;
  sleep_id: string;
  created_at: string;
  updated_at: string;
  score_state: string;
  score?: WhoopRecoveryScore;
}

export interface WhoopRecoveryApiResponse {
  records: WhoopRecoveryApiData[];
  next_token: string | null;
}

export interface WhoopRecoveryDatabaseData {
  id: number;
  cycle_id: number;
  sleep_id: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  score_state: string;
  score?: {
    id: number;
    recovery_id: number;
    user_calibrating?: boolean;
    recovery_score?: number;
    resting_heart_rate?: number;
    hrv_rmssd_milli?: number;
    spo2_percentage?: number | null;
    skin_temp_celsius?: number | null;
  } | null;
}

export interface WhoopRecoveryServiceResponse {
  ok: boolean;
  message: string;
  data: {
    saved_recovery_records: number;
    recovery_records: WhoopRecoveryDatabaseData[];
  };
}
