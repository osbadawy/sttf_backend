import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { WhoopSleep } from './sleep.model';

@Table({
  tableName: 'whoop_sleep_score',
  timestamps: false,
  underscored: true,
})
export class WhoopSleepScore extends Model<WhoopSleepScore> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true }) declare id: number;
  @ForeignKey(() => WhoopSleep) @Column({ type: DataType.UUID }) declare sleep_id: string;

  @Column({type: DataType.DOUBLE, allowNull: true}) declare respiratory_rate?: number;
  @Column({type: DataType.DOUBLE, allowNull: true}) declare sleep_performance_percentage?: number;
  @Column({type: DataType.DOUBLE, allowNull: true}) declare sleep_consistency_percentage?: number;
  @Column({type: DataType.DOUBLE, allowNull: true}) declare sleep_efficiency_percentage?: number;
}
