// src/cycle/cycle_score.model.ts
import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Cycle } from './cycle.model';

@Table({ tableName: 'whoop_cycle_score', timestamps: false })
export class CycleScore extends Model<CycleScore> {
  @ForeignKey(() => Cycle)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  cycle_id: number;

  @Column({ type: DataType.DOUBLE })
  strain?: number;

  @Column({ type: DataType.DOUBLE })
  kilojoule?: number;

  @Column({ type: DataType.DOUBLE })
  average_heart_rate?: number;

  @Column({ type: DataType.DOUBLE })
  max_heart_rate?: number;
}
