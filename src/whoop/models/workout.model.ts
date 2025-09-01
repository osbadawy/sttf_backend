import { Column, DataType, HasOne, Model, Table } from 'sequelize-typescript';
import { WhoopWorkoutScore } from './workout_score.model';
import { PlayerActivity } from '../../user_auth/models/player_activity.model';

// workout.model.ts
@Table({ 
  tableName: 'whoop_workout', 
  timestamps: false,   
  underscored: true 
})

export class WhoopWorkout extends Model<WhoopWorkout> {
  @Column({ type: DataType.UUID, primaryKey: true }) declare id: string;
  // @Column(DataType.BIGINT) v1_id?: number;  // soon to be deprecated
  @Column(DataType.BIGINT) user_id: number;
  @Column(DataType.DATE) created_at: Date;
  @Column(DataType.DATE) updated_at: Date;
  @Column(DataType.DATE) start: Date;
  @Column(DataType.DATE) end: Date;
  @Column(DataType.STRING(6)) timezone_offset: string;
  @Column(DataType.STRING) sport_name: string;
  @Column(DataType.ENUM('SCORED', 'PENDING_SCORE', 'UNSCORABLE'))
  score_state: string;
  // @Column(DataType.INTEGER) sport_id?: number; // soon to be deprecated

  @HasOne(() => WhoopWorkoutScore) score?: WhoopWorkoutScore;
  @HasOne(() => PlayerActivity) player_activity?: PlayerActivity;
}
