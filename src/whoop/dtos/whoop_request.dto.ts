import { WhoopTokens, WhoopUserProfile } from './whoop_user.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsUUID,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';

export class WhoopOAuthRequest extends Request {
  @ApiProperty({})
  @IsString()
  redirect_url: string;

  @ApiProperty({})
  @IsObject()
  user: { uid: string };
}

export class WhoopRequest extends Request {
  @ApiPropertyOptional({ type: () => WhoopTokens })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopTokens)
  whoopTokens?: WhoopTokens;
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

export class WhoopCallbackRequest extends Request {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  redirect_url?: string;
}

export class WhoopAppSingleDayRequest extends Request {
  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiProperty()
  @IsDate()
  day: Date;
}

export class WhoopAppMultiDayRequest extends Request {
  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(30)
  days: number;
}
