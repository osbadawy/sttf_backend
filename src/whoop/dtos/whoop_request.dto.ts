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
    enum: ['web', 'mobile']
  })
  @IsString()
  @IsIn(['web', 'mobile'])
  platform: string;
}

export class WhoopRequest {
  @ApiPropertyOptional({ type: () => WhoopTokens })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopTokens)
  whoopTokens?: WhoopTokens;
}

export class WhoopCallbackRequest {
  @ApiProperty({ type: () => WhoopCallbackRequestQuery })
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopCallbackRequestQuery)
  query: WhoopCallbackRequestQuery;

  @ApiPropertyOptional({ type: () => WhoopTokens })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopTokens)
  whoopTokens?: WhoopTokens;

  @ApiPropertyOptional({ type: () => WhoopUserProfile })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopUserProfile)
  whoopUserProfile?: WhoopUserProfile;

  @ApiPropertyOptional({
    enum: ['web', 'mobile']
  })
  @IsOptional()
  @IsString()
  @IsIn(['web', 'mobile'])
  platform?: string;
}


class WhoopCallbackRequestQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error?: string;
}