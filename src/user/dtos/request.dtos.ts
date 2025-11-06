import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsString,
  Min,
  Max,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsEmail,
  IsUrl,
  IsPhoneNumber,
} from 'class-validator';
import {
  SelfAssessmentOptions,
  type SelfAssessmentType,
} from '../models/player_self_assessment.model';
import type { UserAccess } from '../models/user.model';

export class GetPlayerDayPlanQuery {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firebase_id: string;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  day: Date;
}

///////////////////////////////////////////////////// BODY COMPOSITION ///////////////////////////////////////////////////

export class GetBodyCompositionsQuery {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firebase_id: string;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number;
}

export class CreateBodyCompositionRequest {
  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  day?: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firebase_id: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  weight_kg?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  body_fat_percentage?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  muscle_mass_percentage?: number;
}

export type postBodyCompositionRequest = {
  player_stats_id: string;
  weight?: string | number;
  bmi?: string | number;
  body_fat_percentage?: string | number;
  muscle_mass_percentage?: string | number;
};

export type patchBodyCompositionRequest = {
  id: string;
  data?: {
    weight?: string | number;
    bmi?: string | number;
    body_fat_percentage?: string | number;
    muscle_mass_percentage?: string | number;
  };
} & {
  weight?: string | number;
  bmi?: string | number;
  body_fat_percentage?: string | number;
  muscle_mass_percentage?: string | number;
};

//////////////////////////////////////////////////// PLAYER STATS /////////////////////////////////////////////////////////////////
export type GetByIdRequest = { id: string };

export type CreatePlayerStatsRequest = {
  user_id: string;
  [key: string]: any; // allow optional fields to future-proof
};

export type PatchFields = { [key: string]: any };
export type PatchBodyRequest = { id: string; data?: PatchFields } & PatchFields;

///////////////////////////////////////////////////// USER //////////////////////////////////////////////////////////////////////////////////
export class SignUpBodyRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  access: UserAccess;
}
export class PatchUserBodyRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  birth_date?: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  display_name?: string;

  @ApiProperty()
  @IsIn(['left', 'right'])
  @IsOptional()
  dominant_hand?: 'left' | 'right';

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Min(100)
  @Max(250)
  height_cm?: number;
}
////////////////////////////////////////////////////////////// PLAYER SELF ASSESSMENT ////////////////////////////////////////////////////////

export class PlayerCreateSelfAssessmentRequest {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  score: number;

  @ApiProperty()
  @IsString()
  @IsIn(SelfAssessmentOptions)
  assessment_type: SelfAssessmentType;
}

export class GetPlayerSelfAssessmentsForDate {
  @ApiProperty()
  @IsString()
  firebase_id: string;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  date?: Date;
}

///////////////////////////////////////////////////////////// COACH ASSESSMENT /////////////////////////////////////////////////////////////////////
export class CoachAssessmentRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firebase_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  fitness_score: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  readiness_score: number;
}

export class GetCoachAssessmentsForDate {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firebase_id: string;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  date?: Date;
}

export class GetCoachAssessmentsForAllPlayersOnDayQuery {
  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  day: Date;
}