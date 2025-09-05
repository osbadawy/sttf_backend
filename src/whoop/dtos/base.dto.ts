import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export abstract class ServiceResponseData {
  @ApiProperty()
  @IsNumber()
  num_records_saved: number;

  @ApiProperty({ type: () => [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  records: any[];
}

export abstract class ServiceResponse<T extends ServiceResponseData> {
  @ApiProperty()
  @IsBoolean()
  ok: boolean;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsObject()
  data: T;
}
