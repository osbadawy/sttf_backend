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
import { Meal } from './meal.model';
import { BodyComposition } from './body_composition.model'
import { PlayerSelfAssessment } from './player_self_assessment.model';
import { CoachAssessment } from './coach_assessment.model';

@Table({
  tableName: 'player_stats',
  timestamps: true,
  underscored: true,
})
export class PlayerStats extends Model<PlayerStats> {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Index({ name: 'user_id', unique: true })
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  user_id!: string;

  @Column(DataType.ENUM('left', 'right')) dominant_hand?: 'left' | 'right';
  @Column(DataType.DECIMAL(5,2)) win_rate?: string; 
  @Column(DataType.INTEGER) matches_played?: number;
  @Column(DataType.DECIMAL(5,2)) serve_win_percentage?: string; 
  @Column(DataType.DECIMAL(5,2)) third_ball_conversion_percentage?: string; 
  @Column(DataType.DECIMAL(5,2)) receive_win_percentage?: string;
  @Column(DataType.FLOAT) aggression_ratio?: number;
  @Column(DataType.FLOAT) avg_rally_length?: number;
  @Column(DataType.DECIMAL(5,2)) stats_rating?: string;
  @Column(DataType.DECIMAL(5,2)) physical_rating?: string;
  @Column(DataType.DECIMAL(5,2)) health_rating?: string;

  @BelongsTo(() => User) user?: User;
  @HasMany(() => BodyComposition) body_compositions?: BodyComposition[];
  @HasMany(() => Meal) meals?: Meal[];
  @HasMany(() => PlayerSelfAssessment) self_assessments?: PlayerSelfAssessment[];
  @HasMany(() => CoachAssessment) coach_assessments?: CoachAssessment[];

}
