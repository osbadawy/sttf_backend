import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsDate,
  IsObject,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceResponseData, ServiceResponse } from './base.dto';

export class WhoopCycleScore {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(21)
  strain: number;

  @ApiProperty()
  @IsNumber()
  kilojoule: number;

  @ApiProperty()
  @IsNumber()
  average_heart_rate: number;

  @ApiProperty()
  @IsNumber()
  max_heart_rate: number;
}

export class WhoopCycleScoreWithIds extends WhoopCycleScore {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  cycle_id: number;
}

export class WhoopCycleData {
  @ApiProperty()
  @IsNumber()
  id: number;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end?: Date | null;

  @ApiProperty()
  @IsString()
  timezone_offset: string;

  @ApiProperty()
  @IsString()
  score_state: string;

  @ApiPropertyOptional({ type: () => WhoopCycleScore })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopCycleScore)
  score?: WhoopCycleScore;
}

export class WhoopCycleDataWithIds extends WhoopCycleData {
  @ApiPropertyOptional({ type: () => WhoopCycleScoreWithIds })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopCycleScoreWithIds)
  declare score?: WhoopCycleScoreWithIds;
}

export class WhoopCycleApiResponse {
  @ApiProperty({ type: [WhoopCycleData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopCycleData)
  records: WhoopCycleData[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopCycleServiceResponseData extends ServiceResponseData {
  @ApiProperty({ type: [WhoopCycleDataWithIds] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopCycleDataWithIds)
  declare records: WhoopCycleDataWithIds[];
}

export class WhoopCycleServiceResponse extends ServiceResponse<WhoopCycleServiceResponseData> {}

export interface DaySummaryBasic {
  performance: number;
  stress: number;
  strain: number;
}

export interface DaySummarySleepStageSummary {
  total_in_bed_time_milli: number;
  total_awake_time_milli: number;
  total_no_data_time_milli: number;
  total_light_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_rem_sleep_time_milli: number;
  sleep_cycle_count: number;
  disturbance_count: number;
}

export interface DaySummarySleep {
  score: number;
  durationMilli: number;
  neededMilli: number;
  stage_summary: DaySummarySleepStageSummary;
}

export interface DaySummaryHeart {
  resting: number;
  max: number;
  avg: number;
  hrv: number;
}

export interface DaySummary {
  basic: DaySummaryBasic;
  sleep: DaySummarySleep;
  heart: DaySummaryHeart;
}

export type DateRangeSummary = Record<string, DaySummary>;
