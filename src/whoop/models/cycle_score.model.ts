import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { WhoopCycle } from './cycle.model';

// cycle_score.model.ts
@Table({ 
  tableName: 'whoop_cycle_score', 
  timestamps: false, 
  underscored: true 
})

export class WhoopCycleScore extends Model<WhoopCycleScore> {
  @ForeignKey(() => WhoopCycle)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  cycle_id: number;

  @Column(DataType.DOUBLE) strain?: number;
  @Column(DataType.DOUBLE) kilojoule?: number;
  @Column(DataType.INTEGER) average_heart_rate?: number;
  @Column(DataType.INTEGER) max_heart_rate?: number;
}
