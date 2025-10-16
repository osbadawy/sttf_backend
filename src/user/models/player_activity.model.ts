import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { User } from './user.model';
import { WhoopWorkout } from '../../whoop/models/workout.model';

@Table({
  tableName: 'player_activities',
  timestamps: true,
  underscored: true,
})
export class PlayerActivity extends Model<PlayerActivity> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare user_id: string;

  @Index({ name: 'player_activity_workout_id', unique: true })
  @ForeignKey(() => WhoopWorkout)
  @Column({ type: DataType.UUID, allowNull: true })
  declare workout_id?: string;

  @Column(DataType.STRING) declare activity_type?: string;
  @Column(DataType.DATE) declare started_at: Date;
  @Column(DataType.DATE) declare ended_at: Date;

  @Column(DataType.FLOAT) declare self_assessment_score?: number;

  @Column(DataType.INTEGER) declare points_assigned: number;

  @BelongsTo(() => User) declare user: User;
  @BelongsTo(() => WhoopWorkout) declare workout?: WhoopWorkout;
}
