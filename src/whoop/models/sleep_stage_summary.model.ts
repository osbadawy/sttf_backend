import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { WhoopSleepScore } from './sleep_score.model';

@Table({ tableName: 'whoop_sleep_stage_summary', timestamps: false })
export class WhoopSleepStageSummary extends Model<WhoopSleepStageSummary> {
  @ForeignKey(() => WhoopSleepScore)
  @Column(DataType.BIGINT)
  sleep_score_id: number;

  @Column(DataType.BIGINT) total_in_bed_time_milli: number;
  @Column(DataType.BIGINT) total_awake_time_milli: number;
  @Column(DataType.BIGINT) total_no_data_time_milli: number;
  @Column(DataType.BIGINT) total_light_sleep_time_milli: number;
  @Column(DataType.BIGINT) total_slow_wave_sleep_time_milli: number;
  @Column(DataType.BIGINT) total_rem_sleep_time_milli: number;
  @Column(DataType.INTEGER) sleep_cycle_count: number;
  @Column(DataType.INTEGER) disturbance_count: number;
}
