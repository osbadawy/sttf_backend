import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Patch,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { PlayerStats } from '../models/player_stats.model';
import {coerceValue} from '../util/helper'

import type {GetByIdRequest, CreatePlayerStatsRequest, PatchBodyRequest, PatchFields} from '../dtos/player_stats.request.dtos'
import type {PlayerStatsResponse} from '../dtos/player_stats.response.dtos'

@Controller('player-stats')
@UseGuards(FirebaseAuthGuard)
export class PlayerStatsController {
  constructor(
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
  ) {}

  // ---------- POST: create ----------
  @Post()
  async create(
    @Body() body: CreatePlayerStatsRequest,
  ): Promise<PlayerStatsResponse> {
    const user_id = String(body?.user_id ?? '').trim();
    if (!user_id) throw new BadRequestException('user id is required');

    // Build creation object from allowed attributes dynamically
    const attrs = (this.playerStatsModel as any).getAttributes?.() ??
                  (this.playerStatsModel as any).rawAttributes;
    const createPayload: Record<string, any> = { user_id };

    for (const key of Object.keys(attrs)) {
      if (['id', 'createdAt', 'updatedAt', 'user_id'].includes(key)) continue;
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        createPayload[key] = coerceValue(attrs[key], body[key]);
      }
    }

    try {
      const record = await this.playerStatsModel.create(createPayload as any);
      const data = record.get({ plain: true });
      return { ok: true, data };
    } catch (err: any) {
      if (err instanceof UniqueConstraintError) {
        // user_id unique: a stats row for this user already exists
        throw new ConflictException('PlayerStats already exists for this user.');
      }
      throw new BadRequestException(err?.message ?? 'Failed to create PlayerStats.');
    }
  }

  // ---------- GET: by id (mirrors your Team GET shape using body) ----------
  @Get()
  async getById(@Body() body: GetByIdRequest): Promise<PlayerStatsResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    try {
      const record = await this.playerStatsModel.findByPk(id);
      if (!record) throw new NotFoundException('player_stats not found!');
      return { ok: true, data: record.get({ plain: true }) };
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to get player_stats.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  // ---------- PATCH: dynamic update ----------
  @Patch()
  async patch(@Body() body: PatchBodyRequest): Promise<PlayerStatsResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    // Accept either body.data or flat body
    const src: PatchFields =
      body && typeof body.data === 'object' ? body.data! : body;

    // Build updates by introspecting model attributes
    const attrs = (this.playerStatsModel as any).getAttributes?.() ??
                  (this.playerStatsModel as any).rawAttributes;
    const updates: Record<string, any> = {};

    for (const key of Object.keys(attrs)) {
      if (['id', 'createdAt', 'updatedAt', 'user_id'].includes(key)) continue; // don't allow changing PK/FK/timestamps
      if (!Object.prototype.hasOwnProperty.call(src, key)) continue;

      const rawVal = src[key];
      if (rawVal === undefined) continue; // PATCH semantics: skip undefined
      updates[key] = coerceValue(attrs[key], rawVal);
    }

    try {
      const record = await this.playerStatsModel.findByPk(id);
      if (!record) throw new NotFoundException('player_stats not found');

      if (Object.keys(updates).length > 0) {
        try {
          await record.update(updates);
          await record.reload();
        } catch (err: any) {
          if (err instanceof UniqueConstraintError) {
            throw new ConflictException('Unique constraint violated.');
          }
          throw err;
        }
      }

      return { ok: true, data: record.get({ plain: true }) };
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'Failed to update player_stats.';
      throw new UnauthorizedException(msg);
    }
  }

  // ---------- DELETE: by id ----------
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<PlayerStatsResponse> {
    const _id = String(id ?? '').trim();
    if (!_id) throw new BadRequestException('id is required');

    try {
      const record = await this.playerStatsModel.findByPk(_id);
      if (!record) throw new NotFoundException('player_stats not found');

      const res = record.get({ plain: true });
      await record.destroy();

      return { ok: true, data: res };
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'Failed to delete player_stats.';
      throw new UnauthorizedException(msg);
    }
  }
}
