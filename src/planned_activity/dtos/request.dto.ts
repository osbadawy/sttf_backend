import { ApiProperty } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsString, IsUUID, IsIn, IsOptional, ValidateNested } from "class-validator";


export class PlannedActivityRecurranceDTO {
    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    start: Date;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    end: Date;

    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => value?.map((day: string) => day.toLowerCase()))
    @IsIn(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], { each: true })
    recurring_days: string[]; // Array of day names (automatically converted to lowercase)
}

export class CreatePlannedActivityBodyRequest {
    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    users_assigned: string[];

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    start: Date;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsIn(['technical', 'strength', 'recovery'])
    category: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    activity_type: string;

    @ApiProperty()
    @IsBoolean()
    @IsNotEmpty()
    is_custom: boolean;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    notes: string;

    @ApiProperty()
    @Type(() => PlannedActivityRecurranceDTO)
    @ValidateNested()
    @IsOptional()
    recurrance?: PlannedActivityRecurranceDTO;
}   