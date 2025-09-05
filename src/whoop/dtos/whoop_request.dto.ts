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

export interface WhoopCallbackRequest extends Request {
  query: { code?: string; state?: string; error?: string };
  whoopTokens?: WhoopTokens;
  whoopUserProfile?: WhoopUserProfile;
}
