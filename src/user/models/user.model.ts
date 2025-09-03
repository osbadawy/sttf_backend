// user.model.ts
import {
  Table, Model, Column, DataType, Index, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { HasOne, HasMany } from 'sequelize-typescript';
import { Team } from './team.model';
import { PlayerStats } from './player_stats.model';
import { PlayerActivity } from './player_activity.model';

// ✨ Import these from 'sequelize'
import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
})
export class User extends Model<
  InferAttributes<User>,                // runtime attributes
  InferCreationAttributes<User>        // creation attributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: CreationOptional<string>;

  @Index({ name: 'firebase_id', unique: true })
  @Column({ type: DataType.STRING, allowNull: false })
  declare firebase_id: string;

  @Index({ name: 'whoop_id', unique: true })
  @Column({ type: DataType.STRING, allowNull: true })
  declare whoop_id: CreationOptional<string | null>;

  @ForeignKey(() => Team)
  @Column({ type: DataType.UUID, allowNull: true })
  declare team_id: CreationOptional<string | null>;

  @Index({ name: 'email', unique: true })
  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string; // required at TS level too

  @Column(DataType.STRING) declare display_name: CreationOptional<string | null>;
  @Column(DataType.INTEGER) declare age: CreationOptional<number | null>;
  @Column(DataType.INTEGER) declare phone: CreationOptional<number | null>;
  @Column(DataType.STRING) declare nationality: CreationOptional<string | null>;
  @Column(DataType.STRING) declare avatar_url: CreationOptional<string | null>;
  @Column(DataType.STRING) declare timezone: CreationOptional<string | null>;
  @Column(DataType.DATE) declare last_login_at: CreationOptional<Date | null>;
  @Column(DataType.JSONB) declare metadata: CreationOptional<Record<string, unknown> | null>;

  // timestamps
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;

  // associations should be NonAttribute so they don't pollute attribute typing
  @BelongsTo(() => Team) declare team: NonAttribute<Team | null>;
  @HasOne(() => PlayerStats) declare player_stats: NonAttribute<PlayerStats | null>;
  @HasMany(() => PlayerActivity) declare player_activities: NonAttribute<PlayerActivity[] | null>;
}
