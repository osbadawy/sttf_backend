import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { PlannedActivity } from './planned_activity.model';

@Table({
  tableName: 'planned_activity_recurrence',
  timestamps: true,
  underscored: true,
})
export class PlannedActivityRecurrence extends Model<PlannedActivityRecurrence> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => PlannedActivity)
  @Column({ type: DataType.UUID, allowNull: false })
  declare planned_activity_id: string;

  @Column(DataType.DATE) declare start: Date;
  @Column(DataType.DATE) declare end: Date;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare sun?: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare mon?: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare tue?: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare wed?: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare thu?: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare fri?: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare sat?: boolean;

  @BelongsTo(() => PlannedActivity)
  declare planned_activity?: PlannedActivity;
}
