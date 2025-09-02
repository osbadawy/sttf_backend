import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { PlayerStats } from './player_stats.model';

@Table({
  tableName: 'meals',
  timestamps: true,
  underscored: true,
})
export class Meal extends Model<Meal> {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Index('meals_player_stats_id')
  @ForeignKey(() => PlayerStats)
  @Column({ type: DataType.UUID, allowNull: false }) player_stats_id!: string;
  
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false }) is_recommended!: boolean;
  @Column({ type: DataType.STRING, allowNull: false }) food!: string;
  @Column({ type: DataType.TIME, allowNull: true }) recommended_time?: string;
  @Column({ type: DataType.DATE, allowNull: false }) consumed_at!: Date;
  @Column({ type: DataType.INTEGER, allowNull: true }) calories?: number; // kcal

  @BelongsTo(() => PlayerStats) player_stats?: PlayerStats;
}
