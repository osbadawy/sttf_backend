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

export class WhoopRecoveryScoreWithIds extends WhoopRecoveryScore {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  recovery_id: number;
}

export class WhoopRecoveryData {
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

  @ApiPropertyOptional({ type: () => WhoopRecoveryScore })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopRecoveryScore)
  score?: WhoopRecoveryScore;
}

export class WhoopRecoveryDataWithIds extends WhoopRecoveryData {
  @ApiPropertyOptional({ type: () => WhoopRecoveryScoreWithIds })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopRecoveryScoreWithIds)
  declare score?: WhoopRecoveryScoreWithIds;
}

export class WhoopRecoveryApiResponse {
  @ApiProperty({ type: [WhoopRecoveryData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopRecoveryData)
  records: WhoopRecoveryData[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopRecoveryServiceResponseData extends ServiceResponseData {
  @ApiProperty({ type: [WhoopRecoveryDataWithIds] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopRecoveryDataWithIds)
  declare records: WhoopRecoveryDataWithIds[];
}

export class WhoopRecoveryServiceResponse extends ServiceResponse<WhoopRecoveryServiceResponseData> {}
