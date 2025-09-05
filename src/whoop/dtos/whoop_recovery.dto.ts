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
import { ServiceResponseData, ServiceResponse } from './base.dto';

export class WhoopRecoveryScore {
  @ApiProperty()
  @IsBoolean()
  user_calibrating: boolean;

  @ApiProperty()
  @IsNumber()
  recovery_score: number;

  @ApiProperty()
  @IsNumber()
  resting_heart_rate: number;

  @ApiProperty()
  @IsNumber()
  hrv_rmssd_milli: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  spo2_percentage?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  skin_temp_celsius?: number | null;
}

export class WhoopRecoveryApiData {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  cycle_id: number;

  @ApiProperty()
  @IsString()
  sleep_id: string;

  @ApiProperty()
  @IsString()
  created_at: string;

  @ApiProperty()
  @IsString()
  updated_at: string;

  @ApiProperty()
  @IsString()
  score_state: string;

  @ApiPropertyOptional({ type: () => WhoopRecoveryScore })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopRecoveryScore)
  score?: WhoopRecoveryScore;
}

export class WhoopRecoveryApiResponse {
  @ApiProperty({ type: [WhoopRecoveryApiData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopRecoveryApiData)
  records: WhoopRecoveryApiData[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopRecoveryDatabaseData {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  cycle_id: number;

  @ApiProperty()
  @IsString()
  sleep_id: string;

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
  @IsString()
  score_state: string;

  @ApiPropertyOptional()
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

export class WhoopRecoveryServiceResponseData extends ServiceResponseData {
  @ApiProperty({ type: [WhoopRecoveryDatabaseData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopRecoveryDatabaseData)
  declare records: WhoopRecoveryDatabaseData[];
}

export class WhoopRecoveryServiceResponse extends ServiceResponse<WhoopRecoveryServiceResponseData> {}
