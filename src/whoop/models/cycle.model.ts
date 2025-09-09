// cycle.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  HasOne,
  HasMany,
  ForeignKey,
} from 'sequelize-typescript';
import { WhoopCycleScore } from './cycle_score.model';
import { WhoopSleep } from './sleep.model';
import { WhoopUser } from './whoop_user.model';
import { WhoopRecovery } from './recovery.model';

@Table({
  tableName: 'whoop_cycle',
  timestamps: false,
  underscored: true,
})
export class WhoopCycle extends Model<WhoopCycle> {
  @Column({ type: DataType.BIGINT, primaryKey: true }) declare id: number;
  @ForeignKey(() => WhoopUser) @Column(DataType.BIGINT) declare user_id: number;
  @Column(DataType.DATE) declare created_at: Date;
  @Column(DataType.DATE) declare updated_at: Date;
  @Column(DataType.DATE) declare start: Date;
  @Column({ type: DataType.DATE, allowNull: true }) declare end?: Date | null;
  @Column(DataType.STRING(6)) declare timezone_offset: string;
  @Column(DataType.ENUM('SCORED', 'PENDING_SCORE', 'UNSCORABLE'))
  declare score_state: string;

  @HasOne(() => WhoopCycleScore) declare score?: WhoopCycleScore;
  @HasMany(() => WhoopSleep) declare sleeps?: WhoopSleep[];
  @HasMany(() => WhoopRecovery) declare recoveries?: WhoopRecovery[];
}
