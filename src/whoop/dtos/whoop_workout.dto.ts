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

export class WhoopWorkoutZoneDurations {
  @ApiProperty()
  @IsNumber()
  zone_zero_milli: number;

  @ApiProperty()
  @IsNumber()
  zone_one_milli: number;

  @ApiProperty()
  @IsNumber()
  zone_two_milli: number;

  @ApiProperty()
  @IsNumber()
  zone_three_milli: number;

  @ApiProperty()
  @IsNumber()
  zone_four_milli: number;

  @ApiProperty()
  @IsNumber()
  zone_five_milli: number;
}

export class WhoopWorkoutScore {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(21)
  strain: number;

  @ApiProperty()
  @IsNumber()
  average_heart_rate: number;

  @ApiProperty()
  @IsNumber()
  max_heart_rate: number;

  @ApiProperty()
  @IsNumber()
  kilojoule: number;

  @ApiProperty()
  @IsNumber()
  percent_recorded: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distance_meter?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  altitude_gain_meter?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  altitude_change_meter?: number | null;

  @ApiPropertyOptional({ type: () => WhoopWorkoutZoneDurations })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopWorkoutZoneDurations)
  zone_durations?: WhoopWorkoutZoneDurations;
}

export class WhoopWorkoutApiData {
  @ApiProperty()
  @IsString()
  id: string;

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
  @IsString()
  sport_name: string;

  @ApiProperty()
  @IsString()
  score_state: string;

  @ApiPropertyOptional({ type: () => WhoopWorkoutScore })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopWorkoutScore)
  score?: WhoopWorkoutScore;
}

export class WhoopWorkoutApiResponse {
  @ApiProperty({ type: [WhoopWorkoutApiData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopWorkoutApiData)
  records: WhoopWorkoutApiData[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopWorkoutDatabaseData {
  @ApiProperty()
  @IsString()
  id: string;

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
  @IsString()
  sport_name: string;

  @ApiProperty()
  @IsString()
  score_state: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  score?: {
    id: number;
    workout_id: string;
    strain?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    kilojoule?: number;
    percent_recorded?: number;
    distance_meter?: number | null;
    altitude_gain_meter?: number | null;
    altitude_change_meter?: number | null;
    zone_durations?: WhoopWorkoutZoneDurations;
  } | null;
}

export class WhoopWorkoutServiceResponseData extends ServiceResponseData {
  @ApiProperty({ type: [WhoopWorkoutDatabaseData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopWorkoutDatabaseData)
  declare records: WhoopWorkoutDatabaseData[];
}

export class WhoopWorkoutServiceResponse extends ServiceResponse<WhoopWorkoutServiceResponseData> {}
