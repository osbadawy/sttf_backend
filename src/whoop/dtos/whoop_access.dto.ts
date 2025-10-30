import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddWhoopAccessDto {
  @ApiProperty()
  @IsString()
  client_id: string;

  @ApiProperty()
  @IsString()
  client_secret: string;
}

