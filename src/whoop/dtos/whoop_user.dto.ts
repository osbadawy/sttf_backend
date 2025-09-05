import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsDate,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WhoopUserProfile {
  @ApiProperty({
    description: 'WHOOP user ID',
    example: 12345,
  })
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  last_name: string;
}

export class WhoopTokens {
  @ApiProperty({
    description: 'Authorization token from OAuth flow',
    example: 'auth_token_123',
  })
  @IsString()
  authorization_token: string;

  @ApiProperty({
    description: 'Access token for API authentication',
    example: 'access_token_123',
  })
  @IsString()
  access_token: string;

  @ApiProperty({
    description: 'Refresh token for token renewal',
    example: 'refresh_token_123',
  })
  @IsString()
  refresh_token: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  @IsNumber()
  expires_in: number;

  @ApiProperty({
    description: 'Token expiration date',
    example: '2024-01-01T12:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  expires_at: Date;

  @ApiProperty({
    description: 'Firebase user ID',
    example: 'firebase_uid_123',
  })
  @IsString()
  firebase_id: string;

  @ApiProperty({
    description: 'OAuth scope permissions',
    example: 'read:profile read:cycles',
  })
  @IsString()
  scope: string;
}

export class CreateWhoopUserParams {
  @ApiProperty({
    description: 'WHOOP authentication tokens',
    type: () => WhoopTokens,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopTokens)
  whoopTokens: WhoopTokens;

  @ApiProperty({
    description: 'WHOOP user profile information',
    type: () => WhoopUserProfile,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => WhoopUserProfile)
  whoopUserProfile: WhoopUserProfile;
}
