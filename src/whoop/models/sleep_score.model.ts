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
  underscored: true 
})

export class WhoopSleepScore extends Model<WhoopSleepScore> {
  @ForeignKey(() => WhoopSleep)
  @Column({ type: DataType.UUID, primaryKey: true })
  sleep_id: string;

  @Column(DataType.DOUBLE) respiratory_rate?: number;
  @Column(DataType.DOUBLE) sleep_performance_percentage?: number;
  @Column(DataType.DOUBLE) sleep_consistency_percentage?: number;
  @Column(DataType.DOUBLE) sleep_efficiency_percentage?: number;
}
