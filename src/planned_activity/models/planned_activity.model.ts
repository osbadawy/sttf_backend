import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { User } from 'src/user/models';
import { PlannedActivityItem } from './planned_activity_item.model';

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

  @Column({ type: DataType.STRING, allowNull: true }) declare notes?: string;

  @Column(DataType.STRING) declare category: string;
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare category_is_custom: boolean;

  @Column(DataType.DATE) declare start_date: Date;
  @Column({ type: DataType.DATE, allowNull: true }) declare end_date?: Date;

  @Column(DataType.BOOLEAN) declare is_recurring: boolean;

  //Days Bitmask Su=1, Mo=2, Tu=4, We=8, Th=16, Fr=32, Sa=64
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare recurring_days?: number;

  @HasMany(() => PlannedActivityItem) declare items?: PlannedActivityItem[];
}
