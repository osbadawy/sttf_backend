import {
  BadRequestException,
  NotFoundException,
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
import type { CreationAttributes } from 'sequelize';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { BodyComposition } from '../models/body_composition.model';
import { PlayerStats } from '../models/player_stats.model';

import type {
  bodyCompositionResponse,
  deleteBodyCompositionResponse,
} from '../dtos/response.dtos';
import type {
  postBodyCompositionRequest,
  patchBodyCompositionRequest,
} from '../dtos/request.dtos';

@Controller('body-composition')
@UseGuards(FirebaseAuthGuard)
export class BodyCompositionController {
  constructor(
    @InjectModel(BodyComposition)
    private readonly bodyCompModel: typeof BodyComposition,
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
  ) {}

  // POST: ensure one-by-player_stats_id (create if missing)
  @Post()
  async create(
    @Body()
    body: postBodyCompositionRequest,
  ): Promise<bodyCompositionResponse> {
    const raw = body?.player_stats_id;
    const player_stats_id = String(raw ?? '').trim();
    if (!player_stats_id)
      throw new BadRequestException('player_stats_id is required');

    try {
      // (optional) ensure the PlayerStats row exists
      const ps = await this.playerStatsModel.findByPk(player_stats_id);
      if (!ps) throw new NotFoundException('player_stats not found');

      // find existing body composition for this player_stats_id
      let bc = await this.bodyCompModel.findOne({ where: { player_stats_id } });

      // create if none exists
      if (!bc) {
        const payload = {
          player_stats_id,
          weight: body.weight != null ? String(body.weight) : null,
          bmi: body.bmi != null ? String(body.bmi) : null,
          body_fat_percentage:
            body.body_fat_percentage != null
              ? String(body.body_fat_percentage)
              : null,
          muscle_mass_percentage:
            body.muscle_mass_percentage != null
              ? String(body.muscle_mass_percentage)
              : null,
        };

        bc = await this.bodyCompModel.create(
          payload as unknown as CreationAttributes<BodyComposition>,
        );
      }

      return {
        ok: true,
        data: {
          id: bc.dataValues.id,
          player_stats_id: bc.dataValues.player_stats_id,
          weight: bc.dataValues.weight ?? '',
          bmi: bc.dataValues.bmi ?? '',
          body_fat_percentage: bc.dataValues.body_fat_percentage ?? '',
          muscle_mass_percentage: bc.dataValues.muscle_mass_percentage ?? '',
        },
      };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to save body composition.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  // GET: by id (from body)
  @Get()
  async getByPk(
    @Body() body: { id: string },
  ): Promise<bodyCompositionResponse> {
    const id = body?.id;
    if (!id) throw new BadRequestException('id is required');

    try {
      const bc = await this.bodyCompModel.findByPk(id);
      if (!bc) throw new NotFoundException('body composition not found!');

      return {
        ok: true,
        data: {
          id: bc.dataValues.id,
          player_stats_id: bc.dataValues.player_stats_id,
          weight: bc.dataValues.weight ?? '',
          bmi: bc.dataValues.bmi ?? '',
          body_fat_percentage: bc.dataValues.body_fat_percentage ?? '',
          muscle_mass_percentage: bc.dataValues.muscle_mass_percentage ?? '',
        },
      };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to get body composition.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  // PATCH: by id, only update fields present (simple checks like Team controller)
  @Patch()
  async patch(
    @Body()
    body: patchBodyCompositionRequest,
  ): Promise<bodyCompositionResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    const src = body && typeof body.data === 'object' ? body.data : body;

    const updates: Record<string, any> = {};

    if ('weight' in src) {
      const s = String(src.weight ?? '').trim();
      updates.weight = s || null;
    }

    if ('bmi' in src) {
      const s = String(src.bmi ?? '').trim();
      updates.bmi = s || null;
    }

    if ('body_fat_percentage' in src) {
      const s = String(src.body_fat_percentage ?? '').trim();
      updates.body_fat_percentage = s || null;
    }

    if ('muscle_mass_percentage' in src) {
      const s = String(src.muscle_mass_percentage ?? '').trim();
      updates.muscle_mass_percentage = s || null;
    }

    try {
      const bc = await this.bodyCompModel.findByPk(id);
      if (!bc) throw new NotFoundException('body composition not found');

      if (Object.keys(updates).length > 0) {
        await bc.update(updates);
        await bc.reload();
      }

      return {
        ok: true,
        data: {
          id: bc.dataValues.id,
          player_stats_id: bc.dataValues.player_stats_id,
          weight: bc.dataValues.weight ?? '',
          bmi: bc.dataValues.bmi ?? '',
          body_fat_percentage: bc.dataValues.body_fat_percentage ?? '',
          muscle_mass_percentage: bc.dataValues.muscle_mass_percentage ?? '',
        },
      };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to update body composition.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  // DELETE: by id (param)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<deleteBodyCompositionResponse> {
    try {
      const bc = await this.bodyCompModel.findByPk(id);
      if (!bc) throw new NotFoundException('body composition not found');

      const res = { id: bc.id };
      await bc.destroy();

      return { ok: true, data: res };
    } catch (e: any) {
      const msg =
        e instanceof Error ? e.message : 'Failed to delete body composition.';
      throw new UnauthorizedException(msg);
    }
  }
}
