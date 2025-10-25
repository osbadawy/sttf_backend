import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { User } from 'src/user/models';
import { MealAssignment } from './meal_assignment.model';
import { MealRecurrence } from './meal_recurrence.model';

@Table({
  tableName: 'meal',
  timestamps: true,
  underscored: true,
})
export class Meal extends Model<Meal> {
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
  @Column(DataType.STRING) declare name: string;

  @Column(DataType.DOUBLE) declare kilojoule: number;
  @Column(DataType.DOUBLE) declare grams: number;
  @Column(DataType.DOUBLE) declare protein: number;
  @Column(DataType.DOUBLE) declare carbohydrates: number;
  @Column(DataType.DOUBLE) declare fat: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare is_planned: boolean;

  @Column(DataType.DATE) declare start: Date;

  @HasMany(() => MealAssignment)
  declare players_assigned?: MealAssignment[];
  @HasMany(() => MealRecurrence)
  declare recurrence_patterns?: MealRecurrence[];
}
