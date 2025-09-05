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
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WhoopCycleScore {
  @ApiProperty({
    description: 'Strain score for the cycle',
    example: 12.5
  })
  @IsNumber()
  @Min(0)
  @Max(21)
  strain: number;

  @ApiProperty({
    description: 'Energy expenditure in kilojoules',
    example: 2500
  })
  @IsNumber()
  kilojoule: number;

  @ApiProperty({
    description: 'Average heart rate during the cycle',
    example: 85
  })
  @IsNumber()
  average_heart_rate: number;

  @ApiProperty({
    description: 'Maximum heart rate during the cycle',
    example: 165
  })
  @IsNumber()
  max_heart_rate: number;
}

export class WhoopCycleApiData {
  @ApiProperty({
    description: 'Cycle ID',
    example: 123
  })
  @IsNumber()
  id: number;

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
    description: 'Cycle start time',
    example: '2024-01-01T00:00:00Z'
  })
  @IsString()
  start: string;

  @ApiPropertyOptional({
    description: 'Cycle end time',
    example: '2024-01-01T23:59:59Z'
  })
  @IsOptional()
  @IsString()
  end?: string;

  @ApiProperty({
    description: 'Timezone offset',
    example: '-05:00'
  })
  @IsString()
  timezone_offset: string;

  @ApiProperty({
    description: 'Score state',
    example: 'SCORED'
  })
  @IsString()
  score_state: string;

  @ApiPropertyOptional({
    description: 'Cycle score data',
    type: () => WhoopCycleScore
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopCycleScore)
  score?: WhoopCycleScore;
}

export class WhoopCycleApiResponse {
  @ApiProperty({
    description: 'Array of cycle records',
    type: [WhoopCycleApiData]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopCycleApiData)
  records: WhoopCycleApiData[];

  @ApiPropertyOptional({
    description: 'Next token for pagination',
    example: 'next_token_123'
  })
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopCycleDatabaseData {
  @ApiProperty({
    description: 'Cycle ID',
    example: 123
  })
  @IsNumber()
  id: number;

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
    description: 'Cycle start time',
    example: '2024-01-01T00:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  start: Date;

  @ApiPropertyOptional({
    description: 'Cycle end time',
    example: '2024-01-01T23:59:59Z'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end?: Date | null;

  @ApiProperty({
    description: 'Timezone offset',
    example: '-05:00'
  })
  @IsString()
  timezone_offset: string;

  @ApiProperty({
    description: 'Score state',
    example: 'SCORED'
  })
  @IsString()
  score_state: string;

  @ApiPropertyOptional({
    description: 'Cycle score data'
  })
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

export class WhoopCycleServiceResponse {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  @IsBoolean()
  ok: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Cycle records processed successfully'
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Response data'
  })
  @IsObject()
  data: {
    saved_cycle_records: number;
    cycle_records: WhoopCycleDatabaseData[];
  };
}
