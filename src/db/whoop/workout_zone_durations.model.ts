import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { WhoopWorkoutScore } from './workout_score.model';

@Table({ tableName: 'whoop_workout_zone_durations', timestamps: false })
export class WhoopWorkoutZoneDurations extends Model<WhoopWorkoutZoneDurations> {
    @ForeignKey(() => WhoopWorkoutScore)
    @Column(DataType.UUID) workout_score_id: string;

    @Column(DataType.BIGINT) zone_zero_milli: number;
    @Column(DataType.BIGINT) zone_one_milli: number;
    @Column(DataType.BIGINT) zone_two_milli: number;
    @Column(DataType.BIGINT) zone_three_milli: number;
    @Column(DataType.BIGINT) zone_four_milli: number;
    @Column(DataType.BIGINT) zone_five_milli: number;
}
