// user.model.ts
import {
  Table,
  Model,
  Column,
  DataType,
  Index,
  HasMany,
} from 'sequelize-typescript';
import { HasOne } from 'sequelize-typescript';
import { PlayerStats } from './player_stats.model';
import { WhoopUser } from '../../whoop/models/whoop_user.model';

// ✨ Import these from 'sequelize'
import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';
import { PlannedActivity } from 'src/planned_activity/models/planned_activity.model';
import { PlannedActivityAssignment } from 'src/planned_activity/models/planned_activity_assignment.model';

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
})
export class User extends Model<
  InferAttributes<User>, // runtime attributes
  InferCreationAttributes<User> // creation attributes
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

  @Index({ name: 'email', unique: true })
  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string; // required at TS level too

  @Column(DataType.STRING) declare display_name: CreationOptional<
    string | null
  >;
  @Column(DataType.DATEONLY) declare birth_date: CreationOptional<Date | null>;
  @Column(DataType.STRING) declare phone: CreationOptional<string | null>;
  @Column({ type: DataType.STRING, defaultValue: 'SA' })
  declare nationality: CreationOptional<string | null>;
  @Column(DataType.STRING) declare access: CreationOptional<string | null>;
  @Column(DataType.STRING) declare avatar_url: CreationOptional<string | null>;
  @Column(DataType.STRING) declare timezone: CreationOptional<string | null>;
  @Column(DataType.DATE) declare last_login_at: CreationOptional<Date | null>;
  @Column(DataType.JSONB) declare metadata: CreationOptional<Record<
    string,
    unknown
  > | null>;

  // timestamps
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;

  // associations should be NonAttribute so they don't pollute attribute typing
  @HasOne(() => PlayerStats)
  declare player_stats: NonAttribute<PlayerStats | null>;
  @HasOne(() => WhoopUser) declare whoop_user: NonAttribute<WhoopUser | null>;

  @HasMany(() => PlannedActivity) declare created_activities: NonAttribute<
    PlannedActivity[] | null
  >;
  @HasMany(() => PlannedActivityAssignment)
  declare assigned_activities: NonAttribute<PlannedActivityAssignment[] | null>;
}
