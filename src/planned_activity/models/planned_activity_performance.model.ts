import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
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

  @Column(DataType.FLOAT) declare self_assessment_score: number;

  @Column(DataType.INTEGER) declare points_assigned: number;
}
