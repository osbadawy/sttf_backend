import { WhoopTokens, WhoopUserProfile } from './whoop_user.dto';
import type { Request } from 'express';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsIn,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WhoopOAuthRequest {
  @ApiProperty({
    description: 'Platform type for OAuth request',
    enum: ['web', 'mobile'],
    example: 'web'
  })
  @IsString()
  @IsIn(['web', 'mobile'])
  platform: string;
}

export class WhoopRequest {
  @ApiPropertyOptional({
    description: 'WHOOP tokens for authentication',
    type: () => WhoopTokens
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopTokens)
  whoopTokens?: WhoopTokens;
}

export class WhoopCallbackRequest {
  @ApiProperty({
    description: 'Query parameters',
    type: () => WhoopCallbackRequestQuery
  })
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopCallbackRequestQuery)
  query: WhoopCallbackRequestQuery;

  @ApiPropertyOptional({
    description: 'WHOOP tokens',
    type: () => WhoopTokens
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopTokens)
  whoopTokens?: WhoopTokens;

  @ApiPropertyOptional({
    description: 'WHOOP user profile',
    type: () => WhoopUserProfile
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopUserProfile)
  whoopUserProfile?: WhoopUserProfile;

  @ApiPropertyOptional({
    description: 'Platform type for OAuth request',
    enum: ['web', 'mobile'],
    example: 'web'
  })
  @IsOptional()
  @IsString()
  @IsIn(['web', 'mobile'])
  platform?: string;
}


class WhoopCallbackRequestQuery {
  @ApiPropertyOptional({
    description: 'Authorization code'
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'State'
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Error'
  })
  @IsOptional()
  @IsString()
  error?: string;
}