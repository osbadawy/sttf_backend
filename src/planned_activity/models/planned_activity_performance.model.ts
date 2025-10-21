import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { User } from 'src/user/models';
import { PlannedActivity } from './planned_activity.model';
import { PlannedActivityAssignment } from './planned_activity_assignment.model';

@Table({
  tableName: 'planned_activity_performance',
  timestamps: true,
  underscored: true,
})
export class PlannedActivityPerformance extends Model<PlannedActivityPerformance> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => PlannedActivityAssignment)
  @Column({ type: DataType.UUID, allowNull: false })
  declare assignment_id: string;

  @Column(DataType.DATE) declare completed_at: Date;

  @Column(DataType.FLOAT) declare self_assessment_score: number;

  @Column(DataType.INTEGER) declare points_assigned: number;
}
