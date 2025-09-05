import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsBoolean,
  IsDate,
  IsObject,
  ValidateNested,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WhoopSleepStageSummary {
  @ApiProperty()
  @IsNumber()
  total_in_bed_time_milli: number;

  @ApiProperty()
  @IsNumber()
  total_awake_time_milli: number;

  @ApiProperty()
  @IsNumber()
  total_no_data_time_milli: number;

  @ApiProperty()
  @IsNumber()
  total_light_sleep_time_milli: number;

  @ApiProperty()
  @IsNumber()
  total_slow_wave_sleep_time_milli: number;

  @ApiProperty()
  @IsNumber()
  total_rem_sleep_time_milli: number;

  @ApiProperty()
  @IsNumber()
  sleep_cycle_count: number;

  @ApiProperty()
  @IsNumber()
  disturbance_count: number;
}

export class WhoopSleepNeeded {
  @ApiProperty()
  @IsNumber()
  baseline_milli: number;

  @ApiProperty()
  @IsNumber()
  need_from_sleep_debt_milli: number;

  @ApiProperty()
  @IsNumber()
  need_from_recent_strain_milli: number;

  @ApiProperty()
  @IsNumber()
  need_from_recent_nap_milli: number;
}

export class WhoopSleepScore {
  @ApiProperty()
  @IsNumber()
  respiratory_rate: number;

  @ApiProperty()
  @IsNumber()
  sleep_performance_percentage: number;

  @ApiProperty()
  @IsNumber()
  sleep_consistency_percentage: number;

  @ApiProperty()
  @IsNumber()
  sleep_efficiency_percentage: number;

  @ApiProperty({ type: () => WhoopSleepStageSummary })
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepStageSummary)
  stage_summary: WhoopSleepStageSummary;

  @ApiProperty({ type: () => WhoopSleepNeeded })
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepNeeded)
  sleep_needed: WhoopSleepNeeded;
}

export class WhoopSleepApiData {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNumber()
  cycle_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  v1_id?: number;

  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsString()
  created_at: string;

  @ApiProperty()
  @IsString()
  updated_at: string;

  @ApiProperty()
  @IsString()
  start: string;

  @ApiProperty()
  @IsString()
  end: string;

  @ApiProperty()
  @IsString()
  timezone_offset: string;

  @ApiProperty()
  @IsBoolean()
  nap: boolean;

  @ApiProperty()
  @IsString()
  score_state: string;

  @ApiPropertyOptional({ type: () => WhoopSleepScore })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepScore)
  score?: WhoopSleepScore;
}

export class WhoopSleepApiResponse {
  @ApiProperty({ type: [WhoopSleepApiData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopSleepApiData)
  records: WhoopSleepApiData[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopSleepDatabaseData {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNumber()
  cycle_id: number;

  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  created_at: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  updated_at: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  start: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  end: Date;

  @ApiProperty()
  @IsString()
  timezone_offset: string;

  @ApiProperty()
  @IsBoolean()
  nap: boolean;

  @ApiProperty()
  @IsString()
  score_state: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  @IsObject()
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

export class WhoopSleepServiceResponse {
  @ApiProperty()
  @IsBoolean()
  ok: boolean;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsObject()
  data: {
    saved_sleep_records: number;
    sleep_records: WhoopSleepDatabaseData[];
  };
}
