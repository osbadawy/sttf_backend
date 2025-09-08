import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsDate,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WhoopUserProfile {
  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsString()
  last_name: string;
}

export class WhoopTokens {
  @ApiProperty()
  @IsString()
  authorization_token: string;

  @ApiProperty()
  @IsString()
  access_token: string;

  @ApiProperty()
  @IsString()
  refresh_token: string;

  @ApiProperty()
  @IsNumber()
  expires_in: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  expires_at: Date;

  @ApiProperty()
  @IsString()
  firebase_id: string;

  @ApiProperty()
  @IsString()
  scope: string;
}

export class CreateWhoopUserParams {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsObject()
  user_filter: Record<string, unknown>;

  @ApiProperty()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty()
  @IsString()
  access_token: string;

  @ApiProperty()
  @IsString()
  refresh_token: string;

  @ApiProperty()
  @IsString()
  scope: string;

  @ApiProperty()
  @IsString()
  expires_at: Date;
}

export class WhoopAccessSession {
  @ApiProperty()
  @IsString()
  access_token: string;

  @ApiProperty()
  @IsString()
  refresh_token: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  expires_at: Date;

  @ApiProperty()
  @IsString()
  scope: string;

  @ApiProperty()
  @IsString()
  user_id: string;
}

export class WhoopTokenResponse {
  @ApiProperty()
  @IsString()
  access_token: string;

  @ApiProperty()
  @IsString()
  refresh_token: string;

  @ApiProperty()
  @IsNumber()
  expires_in: number;

  @ApiProperty()
  @IsString()
  scope: string;

  @ApiProperty()
  @IsNumber()
  user_id: number;
}

export class WhoopUserResponse {
  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsString()
  last_name: string;
}

export interface OAuthState {
  user_id: string;
  platform: string;
}
