import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
  } from 'sequelize-typescript';
  import { PlayerStats } from './player_stats.model';
  
  
  @Table({
    tableName: 'daily_points',
    timestamps: true,
    underscored: true,
  })
  export class DailyPoints extends Model<DailyPoints> {
    @Column({
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    })
    declare id: string;
  
    @ForeignKey(() => PlayerStats)
    @Column({ type: DataType.UUID, allowNull: false })
    declare player_stats_id: string;
  
    @Column(DataType.INTEGER) declare points: number;

    @Column(DataType.DATEONLY) declare day: Date;
  
    @BelongsTo(() => PlayerStats) declare player_stats?: PlayerStats;
  }
  