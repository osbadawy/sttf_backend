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

export class WhoopCycleApiData {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  created_at: string;

  @ApiProperty()
  @IsString()
  updated_at: string;

  @ApiProperty()
  @IsString()
  start: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  end?: string;

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

export class WhoopCycleApiResponse {
  @ApiProperty({ type: [WhoopCycleApiData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopCycleApiData)
  records: WhoopCycleApiData[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopCycleDatabaseData {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  score?: {
    id: number;
    cycle_id: number;
    strain?: number;
    kilojoule?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
  } | null;
}

export class WhoopCycleServiceResponseData extends ServiceResponseData {
  @ApiProperty({ type: [WhoopCycleDatabaseData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopCycleDatabaseData)
  declare records: WhoopCycleDatabaseData[];
}

export class WhoopCycleServiceResponse extends ServiceResponse<WhoopCycleServiceResponseData> {}
