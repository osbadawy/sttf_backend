import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { WhoopWorkoutScore } from './workout_score.model';

@Table({
  tableName: 'whoop_workout_zone_durations',
  timestamps: false,
  underscored: true,
})
export class WhoopWorkoutZoneDurations extends Model<WhoopWorkoutZoneDurations> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => WhoopWorkoutScore)
  @Column(DataType.BIGINT)
  declare workout_score_id: number;

  @Column(DataType.BIGINT) declare zone_zero_milli: number;
  @Column(DataType.BIGINT) declare zone_one_milli: number;
  @Column(DataType.BIGINT) declare zone_two_milli: number;
  @Column(DataType.BIGINT) declare zone_three_milli: number;
  @Column(DataType.BIGINT) declare zone_four_milli: number;
  @Column(DataType.BIGINT) declare zone_five_milli: number;
}
