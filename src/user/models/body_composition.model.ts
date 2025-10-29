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
  tableName: 'body_compositions',
  timestamps: true,
  underscored: true,
})
export class BodyComposition extends Model<BodyComposition> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Index('body_comp_player_stats_id')
  @ForeignKey(() => PlayerStats)
  @Column({ type: DataType.UUID, allowNull: false })
  player_stats_id!: string;

  @Column(DataType.DECIMAL(6, 2)) weight_kg?: number; // kg
  @Column(DataType.DECIMAL(4, 1)) bmi?: number;
  @Column(DataType.DECIMAL(5, 2)) body_fat_percentage?: number;
  @Column(DataType.DECIMAL(5, 2)) muscle_mass_percentage?: number;

  @BelongsTo(() => PlayerStats) player_stats?: PlayerStats;
}
