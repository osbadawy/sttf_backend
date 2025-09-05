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
import { ServiceResponseData, ServiceResponse } from './base.dto';

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
  @IsOptional()
  @IsNumber()
  respiratory_rate?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  sleep_performance_percentage?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  sleep_consistency_percentage?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  sleep_efficiency_percentage?: number;

  @ApiPropertyOptional({ type: () => WhoopSleepStageSummary })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepStageSummary)
  stage_summary?: WhoopSleepStageSummary;

  @ApiPropertyOptional({ type: () => WhoopSleepNeeded })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepNeeded)
  sleep_needed?: WhoopSleepNeeded;
}

export class WhoopSleepScoreWithIds extends WhoopSleepScore {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  sleep_id: string;
}

export class WhoopSleepData {
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

  @ApiPropertyOptional({ type: () => WhoopSleepScore })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepScore)
  score?: WhoopSleepScore;
}

export class WhoopSleepDataWithIds extends WhoopSleepData {
  @ApiPropertyOptional({ type: () => WhoopSleepScoreWithIds })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepScoreWithIds)
  declare score?: WhoopSleepScoreWithIds;
}

export class WhoopSleepApiResponse {
  @ApiProperty({ type: [WhoopSleepData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopSleepData)
  records: WhoopSleepData[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopSleepServiceResponseData extends ServiceResponseData {
  @ApiProperty({ type: [WhoopSleepDataWithIds] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopSleepDataWithIds)
  declare records: WhoopSleepDataWithIds[];
}

export class WhoopSleepServiceResponse extends ServiceResponse<WhoopSleepServiceResponseData> {}
