import { ApiProperty } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsString, IsUUID, IsIn, IsOptional, ValidateNested, IsNumber , Min, Max} from "class-validator";


export class PlannedActivityRecurranceDTO {
    @ApiProperty()
    @IsDate()
    @Transform(({ value }) => new Date(value))
    start: Date;

    @ApiProperty()
    @IsDate()
    @Transform(({ value }) => new Date(value))
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
    @Transform(({ value }) => new Date(value))
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

export class UpdatePlannedActivityBodyRequest extends CreatePlannedActivityBodyRequest {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @ApiProperty()
    @IsDate()
    @Transform(({ value }) => new Date(value))
    day: Date;
}

export class UnassignPlannedActivityBodyRequest {
    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    users_assigned: string[];

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @ApiProperty()
    @IsDate()
    @Transform(({ value }) => new Date(value))
    day: Date;
}

export class GetPlannedActivitiesQuery {
    @ApiProperty()
    @IsDate()
    @Transform(({ value }) => new Date(value))
    day: Date;

    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => Array.isArray(value) ? value : [value])
    users_assigned: string[];
}


export class CompletePlannedActivityRequest {
    @ApiProperty()
    @IsNumber()
    @Min(0)
    @Max(1)
    @IsNotEmpty()
    self_assessment_score: number;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    id: string;
}