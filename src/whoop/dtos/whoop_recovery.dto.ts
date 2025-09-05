import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsDate,
  IsObject,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WhoopRecoveryScore {
  @ApiProperty({
    description: 'Whether user is still calibrating',
    example: false
  })
  @IsBoolean()
  user_calibrating: boolean;

  @ApiProperty({
    description: 'Recovery score (0-100)',
    example: 85
  })
  @IsNumber()
  recovery_score: number;

  @ApiProperty({
    description: 'Resting heart rate',
    example: 55
  })
  @IsNumber()
  resting_heart_rate: number;

  @ApiProperty({
    description: 'Heart rate variability (RMSSD) in milliseconds',
    example: 45.2
  })
  @IsNumber()
  hrv_rmssd_milli: number;

  @ApiPropertyOptional({
    description: 'Blood oxygen saturation percentage',
    example: 98.5
  })
  @IsOptional()
  @IsNumber()
  spo2_percentage?: number | null;

  @ApiPropertyOptional({
    description: 'Skin temperature in Celsius',
    example: 36.2
  })
  @IsOptional()
  @IsNumber()
  skin_temp_celsius?: number | null;
}

export class WhoopRecoveryApiData {
  @ApiProperty({
    description: 'Recovery record ID',
    example: 123
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Cycle ID',
    example: 456
  })
  @IsNumber()
  cycle_id: number;

  @ApiProperty({
    description: 'Sleep ID',
    example: 'sleep_123'
  })
  @IsString()
  sleep_id: string;

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
    description: 'Score state',
    example: 'SCORED'
  })
  @IsString()
  score_state: string;

  @ApiPropertyOptional({
    description: 'Recovery score data',
    type: () => WhoopRecoveryScore
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopRecoveryScore)
  score?: WhoopRecoveryScore;
}

export class WhoopRecoveryApiResponse {
  @ApiProperty({
    description: 'Array of recovery records',
    type: [WhoopRecoveryApiData]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopRecoveryApiData)
  records: WhoopRecoveryApiData[];

  @ApiPropertyOptional({
    description: 'Next token for pagination',
    example: 'next_token_123'
  })
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopRecoveryDatabaseData {
  @ApiProperty({
    description: 'Recovery record ID',
    example: 123
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Cycle ID',
    example: 456
  })
  @IsNumber()
  cycle_id: number;

  @ApiProperty({
    description: 'Sleep ID',
    example: 'sleep_123'
  })
  @IsString()
  sleep_id: string;

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
    description: 'Score state',
    example: 'SCORED'
  })
  @IsString()
  score_state: string;

  @ApiPropertyOptional({
    description: 'Recovery score data'
  })
  @IsOptional()
  @IsObject()
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

export class WhoopRecoveryServiceResponse {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  @IsBoolean()
  ok: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Recovery records processed successfully'
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Response data'
  })
  @IsObject()
  data: {
    saved_recovery_records: number;
    recovery_records: WhoopRecoveryDatabaseData[];
  };
}
