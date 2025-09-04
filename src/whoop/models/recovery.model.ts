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
  @ForeignKey(() => WhoopCycle)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  declare cycle_id: number;
  @ForeignKey(() => WhoopSleep)
  @Column({ type: DataType.UUID, primaryKey: true })
  declare sleep_id: string;
  @ForeignKey(() => WhoopUser) @Column(DataType.BIGINT) declare user_id: number;

  @Column(DataType.DATE) created_at: Date;
  @Column(DataType.DATE) updated_at: Date;
  @Column(DataType.ENUM('SCORED', 'PENDING_SCORE', 'UNSCORABLE'))
  score_state: string;

  @HasOne(() => WhoopRecoveryScore) score?: WhoopRecoveryScore;
}
