import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { HasMany } from 'sequelize-typescript';
import { User } from './user.model';
import { BodyComposition } from './body_composition.model';
import { PlayerSelfAssessment } from './player_self_assessment.model';
import { CoachAssessment } from './coach_assessment.model';
import { DailyPoints } from './daily_points.model';

@Table({
  tableName: 'player_stats',
  timestamps: true,
  underscored: true,
})
export class PlayerStats extends Model<PlayerStats> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Index({ name: 'user_id', unique: true })
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare user_id: string;

  @Column(DataType.ENUM('left', 'right')) declare dominant_hand?:
    | 'left'
    | 'right';
  @Column(DataType.DECIMAL(5, 2)) declare win_rate?: string;
  @Column(DataType.INTEGER) declare matches_played?: number;
  @Column(DataType.DECIMAL(5, 2)) declare serve_win_percentage?: string;
  @Column(DataType.DECIMAL(5, 2))
  declare third_ball_conversion_percentage?: string;
  @Column(DataType.DECIMAL(5, 2)) declare receive_win_percentage?: string;
  @Column(DataType.FLOAT) declare aggression_ratio?: number;
  @Column(DataType.FLOAT) declare avg_rally_length?: number;
  @Column(DataType.DECIMAL(5, 2)) declare stats_rating?: string;
  @Column(DataType.DECIMAL(5, 2)) declare physical_rating?: string;
  @Column(DataType.DECIMAL(5, 2)) declare health_rating?: string;

  @BelongsTo(() => User) declare user?: User;
  @HasMany(() => BodyComposition, { as: 'body_compositions' })
  declare body_compositions?: BodyComposition[];
  @HasMany(() => PlayerSelfAssessment, { as: 'self_assessments' })
  declare self_assessments?: PlayerSelfAssessment[];
  @HasMany(() => CoachAssessment, { as: 'coach_assessments' })
  declare coach_assessments?: CoachAssessment[];
  @HasMany(() => DailyPoints, { as: 'daily_points' })
  declare daily_points?: DailyPoints[];
}
