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
  underscored: true 
})

export class WhoopWorkoutScore extends Model<WhoopWorkoutScore> {
  @ForeignKey(() => WhoopWorkout)
  @Column({ type: DataType.UUID, primaryKey: true })
  workout_id: string;

  @Column(DataType.DOUBLE) strain: number;
  @Column(DataType.INTEGER) average_heart_rate: number;
  @Column(DataType.INTEGER) max_heart_rate: number;
  @Column(DataType.DOUBLE) kilojoule: number;
  @Column(DataType.DOUBLE) percent_recorded: number;
  @Column(DataType.DOUBLE) distance_meter?: number;
  @Column(DataType.DOUBLE) altitude_gain_meter?: number;
  @Column(DataType.DOUBLE) altitude_change_meter?: number;
}
