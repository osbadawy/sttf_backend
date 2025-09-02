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
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  user_id!: string;

  @Index({ name: 'player_activity_workout_id', unique: true })
  @ForeignKey(() => WhoopWorkout)

  @Column({ type: DataType.UUID, allowNull: true }) workout_id?: string;
  @Column(DataType.STRING) activity_type?: string; 
  @Column(DataType.DATE) started_at?: Date;
  @Column(DataType.DATE) ended_at?: Date;
  @Column(DataType.INTEGER) duration_seconds?: number;

  @BelongsTo(() => User) user?: User;
  @BelongsTo(() => WhoopWorkout) workout?: WhoopWorkout;
}
