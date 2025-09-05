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
  @ApiProperty({
    description: 'Total time in bed in milliseconds',
    example: 28800000
  })
  @IsNumber()
  total_in_bed_time_milli: number;

  @ApiProperty({
    description: 'Total awake time in milliseconds',
    example: 1800000
  })
  @IsNumber()
  total_awake_time_milli: number;

  @ApiProperty({
    description: 'Total time with no data in milliseconds',
    example: 0
  })
  @IsNumber()
  total_no_data_time_milli: number;

  @ApiProperty({
    description: 'Total light sleep time in milliseconds',
    example: 14400000
  })
  @IsNumber()
  total_light_sleep_time_milli: number;

  @ApiProperty({
    description: 'Total slow wave sleep time in milliseconds',
    example: 7200000
  })
  @IsNumber()
  total_slow_wave_sleep_time_milli: number;

  @ApiProperty({
    description: 'Total REM sleep time in milliseconds',
    example: 5400000
  })
  @IsNumber()
  total_rem_sleep_time_milli: number;

  @ApiProperty({
    description: 'Number of sleep cycles',
    example: 4
  })
  @IsNumber()
  sleep_cycle_count: number;

  @ApiProperty({
    description: 'Number of sleep disturbances',
    example: 2
  })
  @IsNumber()
  disturbance_count: number;
}

export class WhoopSleepNeeded {
  @ApiProperty({
    description: 'Baseline sleep needed in milliseconds',
    example: 28800000
  })
  @IsNumber()
  baseline_milli: number;

  @ApiProperty({
    description: 'Additional sleep needed from sleep debt in milliseconds',
    example: 3600000
  })
  @IsNumber()
  need_from_sleep_debt_milli: number;

  @ApiProperty({
    description: 'Additional sleep needed from recent strain in milliseconds',
    example: 1800000
  })
  @IsNumber()
  need_from_recent_strain_milli: number;

  @ApiProperty({
    description: 'Additional sleep needed from recent nap in milliseconds',
    example: 0
  })
  @IsNumber()
  need_from_recent_nap_milli: number;
}

export class WhoopSleepScore {
  @ApiProperty({
    description: 'Respiratory rate during sleep',
    example: 14.5
  })
  @IsNumber()
  respiratory_rate: number;

  @ApiProperty({
    description: 'Sleep performance percentage',
    example: 85
  })
  @IsNumber()
  sleep_performance_percentage: number;

  @ApiProperty({
    description: 'Sleep consistency percentage',
    example: 78
  })
  @IsNumber()
  sleep_consistency_percentage: number;

  @ApiProperty({
    description: 'Sleep efficiency percentage',
    example: 92
  })
  @IsNumber()
  sleep_efficiency_percentage: number;

  @ApiProperty({
    description: 'Sleep stage summary',
    type: () => WhoopSleepStageSummary
  })
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepStageSummary)
  stage_summary: WhoopSleepStageSummary;

  @ApiProperty({
    description: 'Sleep needed analysis',
    type: () => WhoopSleepNeeded
  })
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepNeeded)
  sleep_needed: WhoopSleepNeeded;
}

export class WhoopSleepApiData {
  @ApiProperty({
    description: 'Sleep record ID',
    example: 'sleep_123'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Cycle ID',
    example: 456
  })
  @IsNumber()
  cycle_id: number;

  @ApiPropertyOptional({
    description: 'V1 ID for backward compatibility',
    example: 789
  })
  @IsOptional()
  @IsNumber()
  v1_id?: number;

  @ApiProperty({
    description: 'User ID',
    example: 12345
  })
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z'
  })
  @IsString()
  created_at: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z'
  })
  @IsString()
  updated_at: string;

  @ApiProperty({
    description: 'Sleep start time',
    example: '2024-01-01T22:00:00Z'
  })
  @IsString()
  start: string;

  @ApiProperty({
    description: 'Sleep end time',
    example: '2024-01-02T06:00:00Z'
  })
  @IsString()
  end: string;

  @ApiProperty({
    description: 'Timezone offset',
    example: '-05:00'
  })
  @IsString()
  timezone_offset: string;

  @ApiProperty({
    description: 'Whether this is a nap',
    example: false
  })
  @IsBoolean()
  nap: boolean;

  @ApiProperty({
    description: 'Score state',
    example: 'SCORED'
  })
  @IsString()
  score_state: string;

  @ApiPropertyOptional({
    description: 'Sleep score data',
    type: () => WhoopSleepScore
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopSleepScore)
  score?: WhoopSleepScore;
}

export class WhoopSleepApiResponse {
  @ApiProperty({
    description: 'Array of sleep records',
    type: [WhoopSleepApiData]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopSleepApiData)
  records: WhoopSleepApiData[];

  @ApiPropertyOptional({
    description: 'Next token for pagination',
    example: 'next_token_123'
  })
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopSleepDatabaseData {
  @ApiProperty({
    description: 'Sleep record ID',
    example: 'sleep_123'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Cycle ID',
    example: 456
  })
  @IsNumber()
  cycle_id: number;

  @ApiProperty({
    description: 'User ID',
    example: 12345
  })
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  updated_at: Date;

  @ApiProperty({
    description: 'Sleep start time',
    example: '2024-01-01T22:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  start: Date;

  @ApiProperty({
    description: 'Sleep end time',
    example: '2024-01-02T06:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  end: Date;

  @ApiProperty({
    description: 'Timezone offset',
    example: '-05:00'
  })
  @IsString()
  timezone_offset: string;

  @ApiProperty({
    description: 'Whether this is a nap',
    example: false
  })
  @IsBoolean()
  nap: boolean;

  @ApiProperty({
    description: 'Score state',
    example: 'SCORED'
  })
  @IsString()
  score_state: string;

  @ApiPropertyOptional({
    description: 'Sleep score data',
  })
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
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  @IsBoolean()
  ok: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Sleep records processed successfully'
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  @IsObject()
  data: {
    saved_sleep_records: number;
    sleep_records: WhoopSleepDatabaseData[];
  };
}
