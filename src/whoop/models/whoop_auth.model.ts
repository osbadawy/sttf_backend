import {
    Table,
    Column,
    Model,
    DataType,
    HasOne,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../user/models/user.model';
import type {
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    NonAttribute,
} from 'sequelize';

@Table({
  tableName: 'whoop_auth',
  timestamps: false,
  underscored: true,
})
export class WhoopAuth extends Model<
    InferAttributes<WhoopAuth>,
    InferCreationAttributes<WhoopAuth>
> {

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID }) declare user_id: string;
    @Column({ type: DataType.STRING }) declare authorization_token_encrypted: string;
    @Column({ type: DataType.STRING }) declare scope: string;
    @Column({ type: DataType.STRING }) declare access_token_encrypted: string;
    @Column({ type: DataType.STRING }) declare refresh_token_encrypted: string;
    @Column({ type: DataType.DATE }) declare expires_at: Date;
}