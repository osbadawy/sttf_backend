import {
  Table,
  Model,
  Column,
  DataType,
  HasMany,
  Index,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({
  tableName: 'team',
  timestamps: true,
  underscored: true,
})
export class Team extends Model<Team> {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column(DataType.STRING) team?: string;
  @Column(DataType.JSONB) metadata?: Record<string, unknown>;

  @HasMany(() => User) users?: User[];
}
