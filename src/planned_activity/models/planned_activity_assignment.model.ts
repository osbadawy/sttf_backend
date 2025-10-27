import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from 'src/user/models';
import { PlannedActivity } from './planned_activity.model';
import { PlannedActivityPerformance } from './planned_activity_performance.model';

@Table({
  tableName: 'planned_activity_assignment',
  timestamps: true,
  underscored: true,
})
export class PlannedActivityAssignment extends Model<PlannedActivityAssignment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => PlannedActivity)
  @Column({ type: DataType.UUID, allowNull: false })
  declare activity_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare assigned_to: string;

  @Column(DataType.DATE) declare assigned_at: Date;
  @Column(DataType.DATE) declare removed_at: Date;

  @BelongsTo(() => User)
  declare assigned_to_user?: User;
  @HasMany(() => PlannedActivityPerformance)
  declare completions?: PlannedActivityPerformance[];
}
