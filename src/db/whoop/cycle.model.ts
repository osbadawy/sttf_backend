// src/cycle/cycle.model.ts
import { Table, Column, Model, DataType, HasOne } from 'sequelize-typescript';
import { CycleScore } from './cycle_score.model';

@Table({ tableName: 'whoop_cycle', timestamps: false })
export class Cycle extends Model<Cycle> {
  @Column({ type: DataType.BIGINT, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.BIGINT, allowNull: false })
  user_id: number;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updated_at: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  start: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  end?: Date;

  @Column({ type: DataType.STRING(6), allowNull: false })
  timezone_offset: string;

  @Column({
    type: DataType.ENUM('SCORED', 'PENDING_SCORE', 'UNSCORABLE'),
    allowNull: false,
  })
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';

  @HasOne(() => CycleScore, { foreignKey: 'cycle_id' })
  score?: CycleScore;
}
