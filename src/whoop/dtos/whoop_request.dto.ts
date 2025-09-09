import { WhoopTokens, WhoopUserProfile } from './whoop_user.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsIn,
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

export class WhoopOAuthRequest {
  @ApiProperty({
    enum: ['web', 'mobile'],
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
    enum: ['web', 'mobile'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['web', 'mobile'])
  platform?: string;
}

export class WhoopAppSingleDayRequest{
  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiProperty()
  @IsDate()
  day: Date
}


export class WhoopAppMultiDayRequest {
  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(30)
  days: number;
}