import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { WhoopSleepScore } from './sleep_score.model';

@Table({
  tableName: 'whoop_sleep_stage_summary',
  timestamps: false,
  underscored: true,
})
export class WhoopSleepStageSummary extends Model<WhoopSleepStageSummary> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: number;
  @ForeignKey(() => WhoopSleepScore)
  @Column(DataType.BIGINT)
  declare sleep_score_id: number;

  @Column({ type: DataType.BIGINT, field: 'total_in_bed_time_milli' }) declare total_in_bed_time_milli: number;
  @Column({ type: DataType.BIGINT, field: 'total_awake_time_milli' }) declare total_awake_time_milli: number;
  @Column({ type: DataType.BIGINT, field: 'total_no_data_time_milli' }) declare total_no_data_time_milli: number;
  @Column({ type: DataType.BIGINT, field: 'total_light_sleep_time_milli' }) declare total_light_sleep_time_milli: number;
  @Column({ type: DataType.BIGINT, field: 'total_slow_wave_sleep_time_milli' }) declare total_slow_wave_sleep_time_milli: number;
  @Column({ type: DataType.BIGINT, field: 'total_rem_sleep_time_milli' }) declare total_rem_sleep_time_milli: number;
  @Column(DataType.INTEGER) declare sleep_cycle_count: number;
  @Column(DataType.INTEGER) declare disturbance_count: number;

  @BelongsTo(() => WhoopSleepScore, { foreignKey: 'sleep_score_id' })
  declare sleep_score: WhoopSleepScore;
}
