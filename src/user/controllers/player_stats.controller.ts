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
import { UniqueConstraintError, type CreationAttributes } from 'sequelize';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { PlayerStats } from '../models/player_stats.model';
import { isRecord } from '../util/helper';

import type {
  GetByIdRequest,
  CreatePlayerStatsRequest,
  PatchBodyRequest,
  PatchFields,
} from '../dtos/player_stats.request.dtos';
import type { PlayerStatsResponse } from '../dtos/player_stats.response.dtos';

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
    const raw = body?.user_id;
    const user_id = String(raw ?? '').trim();
    if (!user_id) throw new BadRequestException('user id is required');

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(user_id))
      throw new BadRequestException('user_id must be a valid UUID');

    try {
      // 1) Look up by user_id (exact match; UUID type—no iLike)
      let stats = await this.playerStatsModel.findOne({ where: { user_id } });

      // 2) Create if missing; handle race with a retry on unique violation
      if (!stats) {
        try {
          stats = await this.playerStatsModel.create({
            user_id,
          } as unknown as CreationAttributes<PlayerStats>);
        } catch (err: unknown) {
          if (err instanceof UniqueConstraintError) {
            stats = await this.playerStatsModel.findOne({ where: { user_id } });
            if (!stats) throw err; // extremely unlikely fallback
          } else {
            throw err;
          }
        }
      }

      // 3) Return plain object safely
      const plain = stats.get({ plain: true }) as unknown;
      if (!isRecord(plain))
        throw new BadRequestException('Unexpected ORM payload.');
      return { ok: true, data: plain };
    } catch (e: unknown) {
      if (e instanceof ConflictException) throw e;
      if (e instanceof UniqueConstraintError) {
        throw new ConflictException(
          'PlayerStats already exists for this user.',
        );
      }
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to save player stats.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  // ---------- GET: by id (mirrors your Team GET shape using body) ----------
  @Get()
  async getPlayerStatsById(
    @Body() body: GetByIdRequest,
  ): Promise<PlayerStatsResponse> {
    const id = body.id;
    if (!id) throw new BadRequestException('id is required');

    try {
      const record = await this.playerStatsModel.findByPk(id);

      if (!record) throw new NotFoundException('player_stats not found!');

      return { ok: true, data: record.get({ plain: true }) };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to get player_stats.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  // ---------- PATCH: dynamic update ----------
  @Patch()
  async patch(
    @Body() body: PatchBodyRequest,
  ): Promise<{ ok: true; data: any }> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    // accept either { id, data: {...} } or flat { id, ...fields }
    const src: PatchFields =
      body && typeof body.data === 'object' ? body.data : body;

    const updates: Record<string, any> = {};

    // ---- presence checks (simple, like your Team example) ----
    if ('dominant_hand' in src) {
      const v = String(src.dominant_hand ?? '')
        .trim()
        .toLowerCase();
      if (v && v !== 'left' && v !== 'right') {
        throw new BadRequestException(
          'dominant_hand must be "left" or "right"',
        );
      }
      updates.dominant_hand = v || null;
    }

    if ('win_rate' in src) {
      const s = String(src.win_rate ?? '').trim();
      updates.win_rate = s || null;
    }

    if ('matches_played' in src) {
      const n = Number(src.matches_played);
      if (!Number.isFinite(n) || n < 0) {
        throw new BadRequestException(
          'matches_played must be a non-negative number',
        );
      }
      updates.matches_played = Math.floor(n);
    }

    if ('serve_win_percentage' in src) {
      const s = String(src.serve_win_percentage ?? '').trim();
      updates.serve_win_percentage = s || null;
    }

    if ('third_ball_conversion_percentage' in src) {
      const s = String(src.third_ball_conversion_percentage ?? '').trim();
      updates.third_ball_conversion_percentage = s || null;
    }

    if ('receive_win_percentage' in src) {
      const s = String(src.receive_win_percentage ?? '').trim();
      updates.receive_win_percentage = s || null;
    }

    if ('aggression_ratio' in src) {
      const n = Number(src.aggression_ratio);
      if (src.aggression_ratio !== undefined && !Number.isFinite(n)) {
        throw new BadRequestException('aggression_ratio must be a number');
      }
      updates.aggression_ratio =
        src.aggression_ratio === undefined ? undefined : n;
    }

    if ('avg_rally_length' in src) {
      const n = Number(src.avg_rally_length);
      if (src.avg_rally_length !== undefined && !Number.isFinite(n)) {
        throw new BadRequestException('avg_rally_length must be a number');
      }
      updates.avg_rally_length =
        src.avg_rally_length === undefined ? undefined : n;
    }

    if ('stats_rating' in src) {
      const s = String(src.stats_rating ?? '').trim();
      updates.stats_rating = s || null;
    }

    if ('physical_rating' in src) {
      const s = String(src.physical_rating ?? '').trim();
      updates.physical_rating = s || null;
    }

    if ('health_rating' in src) {
      const s = String(src.health_rating ?? '').trim();
      updates.health_rating = s || null;
    }

    try {
      const record = await this.playerStatsModel.findByPk(id);
      if (!record) throw new NotFoundException('player_stats not found');

      if (Object.keys(updates).length > 0) {
        await record.update(updates);
        await record.reload();
      }

      return { ok: true, data: record.get({ plain: true }) };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Failed to update player_stats.';
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
      const msg =
        e instanceof Error ? e.message : 'Failed to delete player_stats.';
      throw new UnauthorizedException(msg);
    }
  }
}
