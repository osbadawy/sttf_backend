// models/coach-assessment.model.ts
import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { PlayerStats } from './player_stats.model';

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

  @Index('coach_assessment_player_stats_id')
  @ForeignKey(() => PlayerStats)
  @Column({ type: DataType.UUID, allowNull: false })
  player_stats_id!: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    validate: { min: 1, max: 10 },
  })
  satisfaction_of_training_level!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    validate: { min: 1, max: 10 },
  })
  progress_made_level!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    validate: { min: 1, max: 10 },
  })
  improvements_needed_level!: number;

  @BelongsTo(() => PlayerStats) player_stats?: PlayerStats;
}
