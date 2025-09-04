import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { WhoopWorkout } from './workout.model';

// workout_score.model.ts
@Table({
  tableName: 'whoop_workout_score',
  timestamps: false,
  underscored: true,
})
export class WhoopWorkoutScore extends Model<WhoopWorkoutScore> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: number;
  @ForeignKey(() => WhoopWorkout)
  @Column({ type: DataType.UUID })
  declare workout_id: string;

  @Column(DataType.DOUBLE) declare strain: number;
  @Column(DataType.INTEGER) declare average_heart_rate: number;
  @Column(DataType.INTEGER) declare max_heart_rate: number;
  @Column(DataType.DOUBLE) declare kilojoule: number;
  @Column(DataType.DOUBLE) declare percent_recorded: number;
  @Column({ type: DataType.DOUBLE, allowNull: true }) declare distance_meter?:
    | number
    | null;
  @Column({ type: DataType.DOUBLE, allowNull: true })
  declare altitude_gain_meter?: number | null;
  @Column({ type: DataType.DOUBLE, allowNull: true })
  declare altitude_change_meter?: number | null;
}
