import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { WhoopRecovery } from './recovery.model';

@Table({ tableName: 'whoop_recovery_score', timestamps: false })
export class WhoopRecoveryScore extends Model<WhoopRecoveryScore> {
  @ForeignKey(() => WhoopRecovery)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  recovery_id: number;

  @Column(DataType.BOOLEAN) user_calibrating: boolean;
  @Column(DataType.DOUBLE) recovery_score: number;
  @Column(DataType.DOUBLE) resting_heart_rate: number;
  @Column(DataType.DOUBLE) hrv_rmssd_milli: number;
  @Column(DataType.DOUBLE) spo2_percentage?: number;
  @Column(DataType.DOUBLE) skin_temp_celsius?: number;
}
