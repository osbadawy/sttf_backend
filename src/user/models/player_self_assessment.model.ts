import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { PlayerStats } from './player_stats.model';

export const SelfAssessmentOptions = ['tiredness', 'readiness'] as const;
export type SelfAssessmentType = (typeof SelfAssessmentOptions)[number];

@Table({
  tableName: 'player_self_assessments',
  timestamps: true,
  underscored: true,
})
export class PlayerSelfAssessment extends Model<PlayerSelfAssessment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => PlayerStats)
  @Column({ type: DataType.UUID, allowNull: false })
  declare player_stats_id: string;

  @Column(DataType.FLOAT) declare score?: number;
  @Column(DataType.STRING) declare assessment_type?: SelfAssessmentType;

  @Column(DataType.INTEGER) declare points_assigned: number;

  @BelongsTo(() => PlayerStats) declare player_stats?: PlayerStats;
}
