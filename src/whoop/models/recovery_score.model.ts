import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { WhoopRecovery } from './recovery.model';

@Table({
  tableName: 'whoop_recovery_score',
  timestamps: false,
  underscored: true,
})
export class WhoopRecoveryScore extends Model<WhoopRecoveryScore> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: number;
  @ForeignKey(() => WhoopRecovery)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  declare recovery_id: number;

  @Column(DataType.BOOLEAN) declare user_calibrating: boolean;
  @Column(DataType.DOUBLE) declare recovery_score: number;
  @Column(DataType.DOUBLE) declare resting_heart_rate: number;
  @Column(DataType.DOUBLE) declare hrv_rmssd_milli: number;
  @Column({ type: DataType.DOUBLE, allowNull: true }) declare spo2_percentage?:
    | number
    | null;
  @Column({ type: DataType.DOUBLE, allowNull: true })
  declare skin_temp_celsius?: number | null;
}
