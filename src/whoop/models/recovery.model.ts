import { Column, DataType, ForeignKey, HasOne, Model, Table } from "sequelize-typescript";
import { WhoopRecoveryScore } from "./recovery_score.model";
import { WhoopCycle } from "./cycle.model";
import { WhoopSleep } from "./sleep.model";

@Table({ tableName: 'whoop_recovery', timestamps: false })
export class WhoopRecovery extends Model<WhoopRecovery> {
  @ForeignKey(() => WhoopCycle)
  @Column({ type: DataType.BIGINT, primaryKey: true }) cycle_id: number;
  @ForeignKey(() => WhoopSleep)
  @Column({ type: DataType.UUID, primaryKey: true }) sleep_id: string;
  
  @Column(DataType.BIGINT) user_id: number;
  @Column(DataType.DATE) created_at: Date;
  @Column(DataType.DATE) updated_at: Date;
  @Column(DataType.ENUM('SCORED','PENDING_SCORE','UNSCORABLE')) score_state: string;

  @HasOne(() => WhoopRecoveryScore) score?: WhoopRecoveryScore;
}