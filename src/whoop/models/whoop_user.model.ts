import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from 'src/user/models/user.model';
import type { InferAttributes, InferCreationAttributes } from 'sequelize';

@Table({
  tableName: 'whoop_user',
  timestamps: false,
  underscored: true,
})
export class WhoopUser extends Model<
  InferAttributes<WhoopUser>,
  InferCreationAttributes<WhoopUser>
> {
  @Column({ type: DataType.BIGINT, primaryKey: true }) declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID })
  declare user_id: string;

  @Column({ type: DataType.STRING }) declare email: string;
  @Column({ type: DataType.STRING }) declare first_name: string;
  @Column({ type: DataType.STRING }) declare last_name: string;

  @Column({ type: DataType.STRING }) declare access_token_encrypted: string;
  @Column({ type: DataType.STRING }) declare refresh_token_encrypted: string;
  @Column({ type: DataType.STRING }) declare scope: string;
  @Column({ type: DataType.DATE }) declare expires_at: Date;
}
