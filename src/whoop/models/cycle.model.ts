// cycle.model.ts
import { Table, Column, Model, DataType, HasOne, HasMany, ForeignKey } from 'sequelize-typescript';
import { WhoopCycleScore } from './cycle_score.model';
import { WhoopSleep } from './sleep.model';

@Table({ tableName: 'whoop_cycle', timestamps: false })
export class WhoopCycle extends Model<WhoopCycle> {
  @Column({ type: DataType.BIGINT, primaryKey: true }) declare id: number;
  @Column(DataType.BIGINT) user_id: number;
  @Column(DataType.DATE) created_at: Date;
  @Column(DataType.DATE) updated_at: Date;
  @Column(DataType.DATE) start: Date;
  @Column(DataType.DATE) end?: Date;
  @Column(DataType.STRING(6)) timezone_offset: string;
  @Column(DataType.ENUM('SCORED','PENDING_SCORE','UNSCORABLE')) score_state: string;

  @HasOne(() => WhoopCycleScore) score?: WhoopCycleScore;
  @HasMany(() => WhoopSleep) sleeps?: WhoopSleep[];
}

