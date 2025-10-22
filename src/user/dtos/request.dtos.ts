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
} from 'class-validator';
import {
  SelfAssessmentOptions,
  type SelfAssessmentType,
} from '../models/player_self_assessment.model';

///////////////////////////////////////////////////// BODY COMPOSITION ///////////////////////////////////////////////////
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
export type SignUpBodyRequest = {
  firebase_id: string;
  email: string;
  access: string;
};

export type getUserPkRequest = {
  id: string;
};

export type PatchUserFieldsRequest = {
  email?: string;
  avatar_url?: string;
  age?: number;
  phone?: number;
  nationality?: string;
  display_name?: string;
};

export type PatchUserBodyRequest = {
  id: string;
  data?: PatchUserFieldsRequest;
} & PatchUserFieldsRequest;

////////////////////////////////////////////////////////////// PLAYER SELF ASSESSMENT ////////////////////////////////////////////////////////

export class PlayerCreateSelfAssessmentRequest {
  @ApiProperty()
  @IsString()
  firebase_id: string;

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
export type coachAssessmentRequest = {
  player_stats_id: string;
  satisfaction_of_training_level: number | string;
  progress_made_level: number | string;
  improvements_needed_level: number | string;
};

export type patchCoachAssessmentRequest = {
  id: string;
  data?: {
    satisfaction_of_training_level?: number | string;
    progress_made_level?: number | string;
    improvements_needed_level?: number | string;
  };
} & {
  satisfaction_of_training_level?: number | string;
  progress_made_level?: number | string;
  improvements_needed_level?: number | string;
};
