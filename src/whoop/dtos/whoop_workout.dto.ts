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

export class WhoopWorkoutZoneDurations {
  @ApiProperty({
    description: 'Time in zone zero in milliseconds',
    example: 0
  })
  @IsNumber()
  zone_zero_milli: number;

  @ApiProperty({
    description: 'Time in zone one in milliseconds',
    example: 300000
  })
  @IsNumber()
  zone_one_milli: number;

  @ApiProperty({
    description: 'Time in zone two in milliseconds',
    example: 600000
  })
  @IsNumber()
  zone_two_milli: number;

  @ApiProperty({
    description: 'Time in zone three in milliseconds',
    example: 900000
  })
  @IsNumber()
  zone_three_milli: number;

  @ApiProperty({
    description: 'Time in zone four in milliseconds',
    example: 300000
  })
  @IsNumber()
  zone_four_milli: number;

  @ApiProperty({
    description: 'Time in zone five in milliseconds',
    example: 0
  })
  @IsNumber()
  zone_five_milli: number;
}

export class WhoopWorkoutScore {
  @ApiProperty({
    description: 'Workout strain score',
    example: 15.2
  })
  @IsNumber()
  @Min(0)
  @Max(21)
  strain: number;

  @ApiProperty({
    description: 'Average heart rate during workout',
    example: 145
  })
  @IsNumber()
  average_heart_rate: number;

  @ApiProperty({
    description: 'Maximum heart rate during workout',
    example: 185
  })
  @IsNumber()
  max_heart_rate: number;

  @ApiProperty({
    description: 'Energy expenditure in kilojoules',
    example: 1200
  })
  @IsNumber()
  kilojoule: number;

  @ApiProperty({
    description: 'Percentage of workout recorded',
    example: 95
  })
  @IsNumber()
  percent_recorded: number;

  @ApiPropertyOptional({
    description: 'Distance covered in meters',
    example: 5000
  })
  @IsOptional()
  @IsNumber()
  distance_meter?: number | null;

  @ApiPropertyOptional({
    description: 'Altitude gain in meters',
    example: 150
  })
  @IsOptional()
  @IsNumber()
  altitude_gain_meter?: number | null;

  @ApiPropertyOptional({
    description: 'Altitude change in meters',
    example: 300
  })
  @IsOptional()
  @IsNumber()
  altitude_change_meter?: number | null;

  @ApiPropertyOptional({
    description: 'Heart rate zone durations',
    type: () => WhoopWorkoutZoneDurations
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopWorkoutZoneDurations)
  zone_durations?: WhoopWorkoutZoneDurations;
}

export class WhoopWorkoutApiData {
  @ApiProperty({
    description: 'Workout ID',
    example: 'workout_123'
  })
  @IsString()
  id: string;

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
    description: 'Workout start time',
    example: '2024-01-01T08:00:00Z'
  })
  @IsString()
  start: string;

  @ApiProperty({
    description: 'Workout end time',
    example: '2024-01-01T09:30:00Z'
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
    description: 'Sport name',
    example: 'Running'
  })
  @IsString()
  sport_name: string;

  @ApiProperty({
    description: 'Score state',
    example: 'SCORED'
  })
  @IsString()
  score_state: string;

  @ApiPropertyOptional({
    description: 'Workout score data',
    type: () => WhoopWorkoutScore
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopWorkoutScore)
  score?: WhoopWorkoutScore;
}

export class WhoopWorkoutApiResponse {
  @ApiProperty({
    description: 'Array of workout records',
    type: [WhoopWorkoutApiData]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhoopWorkoutApiData)
  records: WhoopWorkoutApiData[];

  @ApiPropertyOptional({
    description: 'Next token for pagination',
    example: 'next_token_123'
  })
  @IsOptional()
  @IsString()
  next_token: string | null;
}

export class WhoopWorkoutDatabaseData {
  @ApiProperty({
    description: 'Workout ID',
    example: 'workout_123'
  })
  @IsString()
  id: string;

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
    description: 'Workout start time',
    example: '2024-01-01T08:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  start: Date;

  @ApiProperty({
    description: 'Workout end time',
    example: '2024-01-01T09:30:00Z'
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
    description: 'Sport name',
    example: 'Running'
  })
  @IsString()
  sport_name: string;

  @ApiProperty({
    description: 'Score state',
    example: 'SCORED'
  })
  @IsString()
  score_state: string;

  @ApiPropertyOptional({
    description: 'Workout score data',
  })
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

export class WhoopWorkoutServiceResponse {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  @IsBoolean()
  ok: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Workout records processed successfully'
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  @IsObject()
  data: {
    saved_workout_records: number;
    workout_records: WhoopWorkoutDatabaseData[];
  };
}
