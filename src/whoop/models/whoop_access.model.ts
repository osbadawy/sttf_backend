import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { WhoopUser } from './whoop_user.model';

@Table({
  tableName: 'whoop_access',
  timestamps: true,
  underscored: true,
})
export class WhoopAccess extends Model<WhoopAccess> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;
  @Column({ type: DataType.STRING }) declare client_id_encrypted: string;
  @Column({ type: DataType.STRING }) declare client_secret_encrypted: string;

  @HasMany(() => WhoopUser) declare users: WhoopUser[];
}
