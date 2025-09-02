// models/player-self-assessment.model.ts
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
  tableName: 'player_self_assessments',
  timestamps: true,
  underscored: true,
})
export class PlayerSelfAssessment extends Model<PlayerSelfAssessment> {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Index('psa_player_stats_id')
  @ForeignKey(() => PlayerStats)
  @Column({ type: DataType.UUID, allowNull: false })
  player_stats_id!: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    validate: { min: 1, max: 10 },
  })
  tiredness_level!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    validate: { min: 1, max: 10 },
  })
  emotional_level!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    validate: { min: 1, max: 10 },
  })
  progress_achieved_level!: number;

  @BelongsTo(() => PlayerStats) player_stats?: PlayerStats;
}
