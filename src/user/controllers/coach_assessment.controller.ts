// src/modules/coach-assessment/coach-assessment.controller.ts
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
import { CoachAssessment } from '../models/coach_assessment.model';

import type {
  coachAssessmentRequest,
  patchCoachAssessmentRequest,
} from '../dtos/request.dtos';
import type { coachAssessmentResponse } from '../dtos/response.dtos';

@Controller('coach-assessment')
@UseGuards(FirebaseAuthGuard)
export class CoachAssessmentController {
  constructor(
    @InjectModel(CoachAssessment)
    private readonly coachModel: typeof CoachAssessment,
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
  ) {}

  // POST: create a new coach assessment (requires PlayerStats to exist)
  @Post()
  async create(
    @Body()
    body: coachAssessmentRequest,
  ): Promise<coachAssessmentResponse> {
    const player_stats_id = String(body?.player_stats_id ?? '').trim();
    if (!player_stats_id)
      throw new BadRequestException('player_stats_id is required');

    const s = Number(body?.satisfaction_of_training_level);
    const p = Number(body?.progress_made_level);
    const i = Number(body?.improvements_needed_level);

    const inRange = (n: number) => Number.isFinite(n) && n >= 1 && n <= 10;
    if (!inRange(s))
      throw new BadRequestException(
        'satisfaction_of_training_level must be between 1 and 10',
      );
    if (!inRange(p))
      throw new BadRequestException(
        'progress_made_level must be between 1 and 10',
      );
    if (!inRange(i))
      throw new BadRequestException(
        'improvements_needed_level must be between 1 and 10',
      );

    try {
      const ps = await this.playerStatsModel.findByPk(player_stats_id);
      if (!ps) throw new NotFoundException('player_stats not found');

      const rec = await this.coachModel.create({
        player_stats_id,
        satisfaction_of_training_level: s,
        progress_made_level: p,
        improvements_needed_level: i,
      } as unknown as CreationAttributes<CoachAssessment>);

      return {
        ok: true,
        data: {
          id: rec.id,
          player_stats_id: rec.player_stats_id,
          satisfaction_of_training_level: rec.satisfaction_of_training_level,
          progress_made_level: rec.progress_made_level,
          improvements_needed_level: rec.improvements_needed_level,
        },
      };
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Failed to save coach assessment.';
      throw new UnauthorizedException(msg);
    }
  }

  // GET: by id (from body)
  @Get()
  async getByPk(
    @Body() body: { id: string },
  ): Promise<coachAssessmentResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    try {
      const rec = await this.coachModel.findByPk(id);
      if (!rec) throw new NotFoundException('coach assessment not found!');

      return {
        ok: true,
        data: {
          id: rec.id,
          player_stats_id: rec.player_stats_id,
          satisfaction_of_training_level: rec.satisfaction_of_training_level,
          progress_made_level: rec.progress_made_level,
          improvements_needed_level: rec.improvements_needed_level,
        },
      };
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Failed to get coach assessment.';
      throw new UnauthorizedException(msg);
    }
  }

  // PATCH: by id; only update provided fields (simple checks)
  @Patch()
  async patch(
    @Body()
    body: patchCoachAssessmentRequest,
  ): Promise<coachAssessmentResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    const src = body && typeof body.data === 'object' ? body.data : body;

    const updates: Partial<{
      satisfaction_of_training_level: number;
      progress_made_level: number;
      improvements_needed_level: number;
    }> = {};

    const ensureLevel = (val: unknown, label: string): number => {
      const n = Number(val);
      if (!Number.isFinite(n) || n < 1 || n > 10) {
        throw new BadRequestException(`${label} must be between 1 and 10`);
      }
      return n;
    };

    if ('satisfaction_of_training_level' in src) {
      updates.satisfaction_of_training_level = ensureLevel(
        (src as { satisfaction_of_training_level?: unknown })
          .satisfaction_of_training_level,
        'satisfaction_of_training_level',
      );
    }
    if ('progress_made_level' in src) {
      updates.progress_made_level = ensureLevel(
        (src as { progress_made_level?: unknown }).progress_made_level,
        'progress_made_level',
      );
    }
    if ('improvements_needed_level' in src) {
      updates.improvements_needed_level = ensureLevel(
        (src as { improvements_needed_level?: unknown })
          .improvements_needed_level,
        'improvements_needed_level',
      );
    }

    try {
      const rec = await this.coachModel.findByPk(id);
      if (!rec) throw new NotFoundException('coach assessment not found');

      if (Object.keys(updates).length > 0) {
        await rec.update(updates);
        await rec.reload();
      }

      return {
        ok: true,
        data: {
          id: rec.id,
          player_stats_id: rec.player_stats_id,
          satisfaction_of_training_level: rec.satisfaction_of_training_level,
          progress_made_level: rec.progress_made_level,
          improvements_needed_level: rec.improvements_needed_level,
        },
      };
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Failed to update coach assessment.';
      throw new UnauthorizedException(msg);
    }
  }

  // DELETE: by id (param)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<{ ok: boolean; data: { id: string } }> {
    try {
      const rec = await this.coachModel.findByPk(id);
      if (!rec) throw new NotFoundException('coach assessment not found');

      const res = { id: rec.id };
      await rec.destroy();

      return { ok: true, data: res };
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Failed to delete coach assessment.';
      throw new UnauthorizedException(msg);
    }
  }
}
