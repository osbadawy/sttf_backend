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
import { Type, Transform } from 'class-transformer';

export class WhoopOAuthRequest {
  @ApiProperty({})
  @IsString()
  redirect_url: string;

  @ApiProperty({})
  @IsObject()
  user: { uid: string };
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  redirect_url?: string;
}

export class WhoopAppSingleDayRequest {
  @ApiProperty()
  @IsString()
  firebase_id: string;

  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  day: Date;
}

export class WhoopAppMultiDayRequest {
  @ApiProperty()
  @IsString()
  firebase_id: string;

  @ApiProperty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(30)
  days: number;
}
