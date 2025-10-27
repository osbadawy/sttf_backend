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
import { Meal } from './meal.model';
import { MealResults } from './meal_results.model';

@Table({
  tableName: 'meal_assignment',
  timestamps: true,
  underscored: true,
})
export class MealAssignment extends Model<MealAssignment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Meal)
  @Column({ type: DataType.UUID, allowNull: false })
  declare meal_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare assigned_to: string;

  @Column(DataType.DATE) declare assigned_at: Date;
  @Column(DataType.DATE) declare removed_at: Date;

  @BelongsTo(() => User)
  declare assigned_to_user?: User;
  @HasMany(() => MealResults)
  declare completions?: MealResults[];
}
