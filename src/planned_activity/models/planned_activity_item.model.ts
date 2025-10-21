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

@Table({
  tableName: 'planned_activity_item',
  timestamps: true,
  underscored: true,
})
export class PlannedActivityItem extends Model<PlannedActivityItem> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => PlannedActivity)
  @Column({ type: DataType.UUID, allowNull: false })
  declare activity_id: string;

  @Column(DataType.STRING)
  declare activity_type: string;

  @Column(DataType.INTEGER)
  declare item_index: number;
}
