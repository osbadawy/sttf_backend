import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { MealAssignment } from './meal_assignment.model';

@Table({
  tableName: 'meal_results',
  timestamps: true,
  underscored: true,
})
export class MealResults extends Model<MealResults> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => MealAssignment)
  @Column({ type: DataType.UUID, allowNull: false })
  declare assignment_id: string;

  @Column({ type: DataType.STRING, allowNull: true }) declare img_url?: string;

  @Column(DataType.INTEGER) declare points_assigned: number;
}
