// models/coach-assessment.model.ts
import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { PlayerStats } from './player_stats.model';
import { User } from './user.model';

@Table({
  tableName: 'coach_assessments',
  timestamps: true,
  underscored: true,
})
export class CoachAssessment extends Model<CoachAssessment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => PlayerStats)
  @Column({ type: DataType.UUID, allowNull: false })
  declare player_stats_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare assigned_by: string;

  @Column(DataType.DATEONLY) declare day: Date;

  @Column(DataType.FLOAT) declare fitness_score?: number;
  @Column(DataType.FLOAT) declare readiness_score?: number;

  @Column(DataType.INTEGER) declare points_assigned: number;

  @BelongsTo(() => PlayerStats) player_stats?: PlayerStats;
}
