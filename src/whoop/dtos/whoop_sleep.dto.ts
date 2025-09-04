export interface WhoopSleepStageSummary {
  total_in_bed_time_milli: number;
  total_awake_time_milli: number;
  total_no_data_time_milli: number;
  total_light_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_rem_sleep_time_milli: number;
  sleep_cycle_count: number;
  disturbance_count: number;
}

export interface WhoopSleepNeeded {
  baseline_milli: number;
  need_from_sleep_debt_milli: number;
  need_from_recent_strain_milli: number;
  need_from_recent_nap_milli: number;
}

export interface WhoopSleepScore {
  respiratory_rate: number;
  sleep_performance_percentage: number;
  sleep_consistency_percentage: number;
  sleep_efficiency_percentage: number;
  stage_summary: WhoopSleepStageSummary;
  sleep_needed: WhoopSleepNeeded;
}

export interface WhoopSleepApiData {
  id: string;
  cycle_id: number;
  v1_id?: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score?: WhoopSleepScore;
}

export interface WhoopSleepApiResponse {
  records: WhoopSleepApiData[];
  next_token: string | null;
}

export interface WhoopSleepDatabaseData {
  id: string;
  cycle_id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  start: Date;
  end: Date;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score?: {
    id: number;
    sleep_id: string;
    respiratory_rate?: number;
    sleep_performance_percentage?: number;
    sleep_consistency_percentage?: number;
    sleep_efficiency_percentage?: number;
    stage_summary?: WhoopSleepStageSummary;
    sleep_needed?: WhoopSleepNeeded;
  } | null;
}

export interface WhoopSleepServiceResponse {
  ok: boolean;
  message: string;
  data: {
    total_sleep_records: number;
    saved_sleep_records: number;
    sleep_records: WhoopSleepDatabaseData[];
  };
}
