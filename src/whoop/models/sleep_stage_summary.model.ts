import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { WhoopSleepScore } from './sleep_score.model';

@Table({
  tableName: 'whoop_sleep_stage_summary',
  timestamps: false,
  underscored: true,
})
export class WhoopSleepStageSummary extends Model<WhoopSleepStageSummary> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true }) declare id: number;
  @ForeignKey(() => WhoopSleepScore) @Column(DataType.BIGINT) declare sleep_score_id: number;

  @Column(DataType.BIGINT) declare total_in_bed_time_milli: number;
  @Column(DataType.BIGINT) declare total_awake_time_milli: number;
  @Column(DataType.BIGINT) declare total_no_data_time_milli: number;
  @Column(DataType.BIGINT) declare total_light_sleep_time_milli: number;
  @Column(DataType.BIGINT) declare total_slow_wave_sleep_time_milli: number;
  @Column(DataType.BIGINT) declare total_rem_sleep_time_milli: number;
  @Column(DataType.INTEGER) declare sleep_cycle_count: number;
  @Column(DataType.INTEGER) declare disturbance_count: number;
}
