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
  underscored: true,
})
export class WhoopCycleScore extends Model<WhoopCycleScore> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => WhoopCycle)
  @Column({ type: DataType.BIGINT })
  declare cycle_id: number;

  @Column(DataType.DOUBLE) declare strain?: number;
  @Column(DataType.DOUBLE) declare kilojoule?: number;
  @Column(DataType.INTEGER) declare average_heart_rate?: number;
  @Column(DataType.INTEGER) declare max_heart_rate?: number;
}
