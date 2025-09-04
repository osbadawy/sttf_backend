import {
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { WhoopRecoveryScore } from './recovery_score.model';
import { WhoopCycle } from './cycle.model';
import { WhoopSleep } from './sleep.model';
import { WhoopUser } from './whoop_user.model';

@Table({
  tableName: 'whoop_recovery',
  timestamps: false,
  underscored: true,
})
export class WhoopRecovery extends Model<WhoopRecovery> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: number;
  @ForeignKey(() => WhoopCycle)
  @Column({ type: DataType.BIGINT })
  declare cycle_id: number;
  @ForeignKey(() => WhoopSleep)
  @Column({ type: DataType.UUID })
  declare sleep_id: string;
  @ForeignKey(() => WhoopUser) @Column(DataType.BIGINT) declare user_id: number;

  @Column(DataType.DATE) declare created_at: Date;
  @Column(DataType.DATE) declare updated_at: Date;
  @Column(DataType.ENUM('SCORED', 'PENDING_SCORE', 'UNSCORABLE'))
  declare score_state: string;

  @HasOne(() => WhoopRecoveryScore) declare score?: WhoopRecoveryScore;
}
