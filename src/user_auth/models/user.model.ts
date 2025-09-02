import {
  Table,
  Model,
  Column,
  DataType,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { HasOne, HasMany } from 'sequelize-typescript';
import { Team } from './team.model';
import { PlayerStats } from './player_stats.model';
import { PlayerActivity } from './player_activity.model';

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
})
export class User extends Model<User> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Index({ name: 'firebase_id', unique: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  firebase_id!: string;

  @Index({ name: 'whoop_id', unique: true })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  whoop_id?: string;

  @ForeignKey(() => Team)
  @Column({ type: DataType.UUID, allowNull: true })
  team_id?: string;

  @Index({ name: 'email', unique: true })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email?: string;

  @Column(DataType.STRING) display_name?: string;
  @Column(DataType.INTEGER) age?: number;
  @Column(DataType.INTEGER) phone?: number;
  @Column(DataType.STRING) nationality?: string;
  @Column(DataType.STRING) avatar_url?: string;
  @Column(DataType.STRING) timezone?: string;
  @Column(DataType.DATE) last_login_at?: Date;
  @Column(DataType.JSONB) metadata?: Record<string, unknown>;

  @BelongsTo(() => Team) team?: Team;
  @HasOne(() => PlayerStats) player_stats?: PlayerStats;
  @HasMany(() => PlayerActivity) player_activities?: PlayerActivity[];
}
