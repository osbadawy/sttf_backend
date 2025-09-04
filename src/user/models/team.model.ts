// team.model.ts
import {
  Table,
  Model,
  Column,
  DataType,
  HasMany,
  Index,
} from 'sequelize-typescript';
import { User } from './user.model';

import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';

@Table({
  tableName: 'team',
  timestamps: true,
  underscored: true,
})
export class Team extends Model<
  InferAttributes<Team>,
  InferCreationAttributes<Team>
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: CreationOptional<string>;

  @Index({ name: 'team_unique', unique: true })
  @Column({ type: DataType.STRING, allowNull: false })
  declare team: string;

  @Column(DataType.JSONB)
  declare metadata: CreationOptional<Record<string, unknown> | null>;

  @Column(DataType.INTEGER) totalPlayers?: number;
  @Column(DataType.STRING) image?: string;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;

  @HasMany(() => User)
  declare users: NonAttribute<User[] | null>;
}
