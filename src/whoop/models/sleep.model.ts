import {
  Table,
  Column,
  Model,
  DataType,
  HasOne,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { WhoopSleepScore } from './sleep_score.model';
import { WhoopCycle } from './cycle.model';
import { WhoopUser } from './whoop_user.model';

// sleep.model.ts
@Table({
  tableName: 'whoop_sleep',
  timestamps: false,
  underscored: true,
})
export class WhoopSleep extends Model<WhoopSleep> {
  @Column({ type: DataType.UUID, primaryKey: true }) declare id: string;
  @ForeignKey(() => WhoopCycle) @Column(DataType.BIGINT) declare cycle_id: number;
  @ForeignKey(() => WhoopUser) @Column(DataType.BIGINT) declare user_id: number;

  // @Column(DataType.BIGINT) v1_id?: number; #v1 not used
  @Column(DataType.DATE) declare created_at: Date;
  @Column(DataType.DATE) declare updated_at: Date;
  @Column(DataType.DATE) declare start: Date;
  @Column(DataType.DATE) declare end: Date;
  @Column(DataType.STRING(6)) declare timezone_offset: string;
  @Column(DataType.BOOLEAN) declare nap: boolean;
  @Column(DataType.ENUM('SCORED', 'PENDING_SCORE', 'UNSCORABLE')) declare score_state: string;

  @HasOne(() => WhoopSleepScore) declare score?: WhoopSleepScore;
  @BelongsTo(() => WhoopCycle) declare cycle?: WhoopCycle;
}
