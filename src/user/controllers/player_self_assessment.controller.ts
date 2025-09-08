// src/modules/player-self-assessment/player-self-assessment.controller.ts
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes } from 'sequelize';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { PlayerStats } from '../models/player_stats.model';
import { PlayerSelfAssessment } from '../models/player_self_assessment.model';

import type {PlayerSelfAssessmentRequest, patchPlayerSelfAssessmentRequest} from '../dtos/request.dtos'
import type {playerSelfAssessmentResponse} from '../dtos/response.dtos'

@Controller('player-self-assessment')
@UseGuards(FirebaseAuthGuard)
export class PlayerSelfAssessmentController {
  constructor(
    @InjectModel(PlayerSelfAssessment)
    private readonly psaModel: typeof PlayerSelfAssessment,
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
  ) {}

  // POST: create a new self assessment (requires PlayerStats to exist)
  @Post()
  async create(
    @Body()
    body: PlayerSelfAssessmentRequest,
  ): Promise<playerSelfAssessmentResponse> {
    const player_stats_id = String(body?.player_stats_id ?? '').trim();
    if (!player_stats_id) throw new BadRequestException('player_stats_id is required');

    const t = Number(body?.tiredness_level);
    const e = Number(body?.emotional_level);
    const p = Number(body?.progress_achieved_level);

    const inRange = (n: number) => Number.isFinite(n) && n >= 1 && n <= 10;
    if (!inRange(t)) throw new BadRequestException('tiredness_level must be between 1 and 10');
    if (!inRange(e)) throw new BadRequestException('emotional_level must be between 1 and 10');
    if (!inRange(p)) throw new BadRequestException('progress_achieved_level must be between 1 and 10');

    try {
      // ensure the parent PlayerStats exists
      const ps = await this.playerStatsModel.findByPk(player_stats_id);
      if (!ps) throw new NotFoundException('player_stats not found');

      const record = await this.psaModel.create(
        {
          player_stats_id,
          tiredness_level: t,
          emotional_level: e,
          progress_achieved_level: p,
        } as unknown as CreationAttributes<PlayerSelfAssessment>,
      );

      return {
        ok: true,
        data: {
          id: record.id,
          player_stats_id: record.player_stats_id,
          tiredness_level: record.tiredness_level,
          emotional_level: record.emotional_level,
          progress_achieved_level: record.progress_achieved_level,
        },
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save self assessment.';
      throw new UnauthorizedException(msg);
    }
  }

  // GET: by id (from body)
  @Get()
  async getByPk(
    @Body() body: { id: string },
  ): Promise<playerSelfAssessmentResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    try {
      const rec = await this.psaModel.findByPk(id);
      if (!rec) throw new NotFoundException('player self assessment not found!');

      return {
        ok: true,
        data: {
          id: rec.id,
          player_stats_id: rec.player_stats_id,
          tiredness_level: rec.tiredness_level,
          emotional_level: rec.emotional_level,
          progress_achieved_level: rec.progress_achieved_level,
        },
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to get self assessment.';
      throw new UnauthorizedException(msg);
    }
  }

  // PATCH: by id; only update provided fields (simple checks like Team)
  @Patch()
  async patch(
    @Body()
    body: patchPlayerSelfAssessmentRequest,
  ): Promise<playerSelfAssessmentResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    const src =
      body && typeof body.data === 'object' ? body.data : body;

    const updates: Partial<{
      tiredness_level: number;
      emotional_level: number;
      progress_achieved_level: number;
    }> = {};

    const ensureLevel = (val: unknown, label: string): number => {
      const n = Number(val);
      if (!Number.isFinite(n) || n < 1 || n > 10) {
        throw new BadRequestException(`${label} must be between 1 and 10`);
      }
      return n;
    };

    if ('tiredness_level' in src) {
      updates.tiredness_level = ensureLevel((src as { tiredness_level?: unknown }).tiredness_level, 'tiredness_level');
    }
    if ('emotional_level' in src) {
      updates.emotional_level = ensureLevel((src as { emotional_level?: unknown }).emotional_level, 'emotional_level');
    }
    if ('progress_achieved_level' in src) {
      updates.progress_achieved_level = ensureLevel(
        (src as { progress_achieved_level?: unknown }).progress_achieved_level,
        'progress_achieved_level',
      );
    }

    try {
      const rec = await this.psaModel.findByPk(id);
      if (!rec) throw new NotFoundException('player self assessment not found');

      if (Object.keys(updates).length > 0) {
        await rec.update(updates);
        await rec.reload();
      }

      return {
        ok: true,
        data: {
          id: rec.id,
          player_stats_id: rec.player_stats_id,
          tiredness_level: rec.tiredness_level,
          emotional_level: rec.emotional_level,
          progress_achieved_level: rec.progress_achieved_level,
        },
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update self assessment.';
      throw new UnauthorizedException(msg);
    }
  }

  // DELETE: by id (param)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<{ ok: boolean; data: { id: string } }> {
    try {
      const rec = await this.psaModel.findByPk(id);
      if (!rec) throw new NotFoundException('player self assessment not found');

      const res = { id: rec.id };
      await rec.destroy();

      return { ok: true, data: res };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete self assessment.';
      throw new UnauthorizedException(msg);
    }
  }
}
