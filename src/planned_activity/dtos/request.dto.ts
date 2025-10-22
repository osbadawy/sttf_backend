import { ApiProperty } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsString, IsUUID, IsIn, IsOptional } from "class-validator";

export class CreatePlannedActivityBodyRequest {
    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    users_assigned: string[];

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    starts_at: Date;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    ends_at: Date;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    notes: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty()
    @IsBoolean()
    @IsNotEmpty()
    category_is_custom: boolean;

    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => value?.map((day: string) => day.toLowerCase()))
    @IsIn(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], { each: true })
    @IsOptional()
    recurring_days?: string[]; // Array of day names (automatically converted to lowercase)

    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    activity_items: string[];
}   