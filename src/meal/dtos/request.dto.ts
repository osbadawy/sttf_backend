import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsIn,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsUrl,
} from 'class-validator';

export class MealRecurrenceDTO {
  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  start: Date;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  end?: Date;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }): string[] =>
    Array.isArray(value) ? value.map((day: string) => day.toLowerCase()) : [],
  )
  @IsIn(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], { each: true })
  recurring_days: string[]; // Array of day names (automatically converted to lowercase)
}

export class CreateMealBodyRequest {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  users_assigned: string[];

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  start: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(['breakfast', 'lunch', 'dinner', 'snack'])
  category: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  kilojoule?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  amount_unit: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  protein?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  carbohydrates?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  fat?: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  is_planned: boolean;

  @ApiProperty()
  @Type(() => MealRecurrenceDTO)
  @ValidateNested()
  @IsOptional()
  recurrance?: MealRecurrenceDTO;
}

export class UpdateMealBodyRequest extends CreateMealBodyRequest {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  day: Date;
}

export class UnassignMealBodyRequest {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  users_assigned: string[];

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  day: Date;
}

export class GetMealsQuery {
  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  day: Date;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }): string[] => (Array.isArray(value) ? value : [value]))
  users_assigned: string[];
}

export class GetMealsParams {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  users_assigned: string[];

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsIn(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], { each: true })
  dayOfWeek?: string;
}

export class CompleteMealRequest {
  @ApiProperty()
  @IsUrl()
  @IsOptional()
  img_url?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
