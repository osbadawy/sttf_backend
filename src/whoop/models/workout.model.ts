import {
  Column,
  DataType,
  HasOne,
  Model,
  Table,
  ForeignKey,
} from 'sequelize-typescript';
import { WhoopWorkoutScore } from './workout_score.model';
import { PlayerActivity } from 'src/user/models/player_activity.model';
import { WhoopUser } from './whoop_user.model';

// workout.model.ts
@Table({
  tableName: 'whoop_workout',
  timestamps: false,
  underscored: true,
})
export class WhoopWorkout extends Model<WhoopWorkout> {
  @Column({ type: DataType.UUID, primaryKey: true }) declare id: string;
  // @Column(DataType.BIGINT) v1_id?: number;  // soon to be deprecated
  @ForeignKey(() => WhoopUser) @Column(DataType.BIGINT) declare user_id: number;

  @Column(DataType.DATE) declare created_at: Date;
  @Column(DataType.DATE) declare updated_at: Date;
  @Column(DataType.DATE) declare start: Date;
  @Column(DataType.DATE) declare end: Date;
  @Column(DataType.STRING(6)) declare timezone_offset: string;
  @Column(DataType.STRING) declare sport_name: string;
  @Column(DataType.ENUM('SCORED', 'PENDING_SCORE', 'UNSCORABLE'))
  declare score_state: string;
  // @Column(DataType.INTEGER) sport_id?: number; // soon to be deprecated

  @HasOne(() => WhoopWorkoutScore) declare score?: WhoopWorkoutScore;
  @HasOne(() => PlayerActivity) declare player_activity?: PlayerActivity;
}
