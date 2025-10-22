import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { User } from 'src/user/models';
import { PlannedActivityAssignment } from './planned_activity_assignment.model';
import { PlannedActivityRecurrence } from './planned_activity_recurrence.model';

@Table({
  tableName: 'planned_activity',
  timestamps: true,
  underscored: true,
})
export class PlannedActivity extends Model<PlannedActivity> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare assigned_by: string;

  @Column(DataType.STRING) declare category: string;
  @Column(DataType.STRING) declare activity_type: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare is_custom: boolean;

  @Column({ type: DataType.STRING, allowNull: true }) declare notes?: string;

  @Column(DataType.DATE) declare start: Date;

  @HasMany(() => PlannedActivityAssignment)
  declare players_assigned?: PlannedActivityAssignment[];
  @HasMany(() => PlannedActivityRecurrence)
  declare recurrence_patterns?: PlannedActivityRecurrence[];
}
