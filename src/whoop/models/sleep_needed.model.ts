import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { WhoopSleepScore } from './sleep_score.model';

@Table({ 
  tableName: 'whoop_sleep_needed', 
  timestamps: false, 
  underscored: true 
})

export class WhoopSleepNeeded extends Model<WhoopSleepNeeded> {
  @ForeignKey(() => WhoopSleepScore)
  @Column(DataType.BIGINT)
  sleep_score_id: number;

  @Column(DataType.BIGINT) baseline_milli: number;
  @Column(DataType.BIGINT) need_from_sleep_debt_milli: number;
  @Column(DataType.BIGINT) need_from_recent_strain_milli: number;
  @Column(DataType.BIGINT) need_from_recent_nap_milli: number;
}
