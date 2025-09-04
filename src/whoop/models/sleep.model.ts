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
  @ForeignKey(() => WhoopCycle) @Column(DataType.BIGINT) cycle_id: number;
  @ForeignKey(() => WhoopUser)@Column(DataType.BIGINT) declare user_id: number;


  // @Column(DataType.BIGINT) v1_id?: number; #v1 not used
  @Column(DataType.DATE) created_at: Date;
  @Column(DataType.DATE) updated_at: Date;
  @Column(DataType.DATE) start: Date;
  @Column(DataType.DATE) end: Date;
  @Column(DataType.STRING(6)) timezone_offset: string;
  @Column(DataType.BOOLEAN) nap: boolean;
  @Column(DataType.ENUM('SCORED', 'PENDING_SCORE', 'UNSCORABLE'))
  score_state: string;

  @HasOne(() => WhoopSleepScore) score?: WhoopSleepScore;
  @BelongsTo(() => WhoopCycle) cycle?: WhoopCycle;
}
