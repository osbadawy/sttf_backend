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
import { Op, CreationAttributes } from 'sequelize';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { Meal } from '../models/meal.model';
import { PlayerStats } from '../models/player_stats.model';

import type { mealRequest, patchMealRequest } from '../dtos/request.dtos';
import type { mealResponse } from '../dtos/response.dtos';

@Controller('meals')
@UseGuards(FirebaseAuthGuard)
export class MealsController {
  constructor(
    @InjectModel(Meal) private readonly mealModel: typeof Meal,
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
  ) {}

  // POST: ensure PlayerStats exists; return existing identical meal if found; else create
  @Post()
  async create(
    @Body()
    body: mealRequest,
  ): Promise<mealResponse> {
    const player_stats_id = String(body?.player_stats_id ?? '').trim();
    const food = String(body?.food ?? '').trim();
    const consumedAtRaw = body?.consumed_at;

    if (!player_stats_id)
      throw new BadRequestException('player_stats_id is required');
    if (!food) throw new BadRequestException('food is required');
    if (!consumedAtRaw)
      throw new BadRequestException('consumed_at is required');

    const consumed_at =
      consumedAtRaw instanceof Date
        ? consumedAtRaw
        : new Date(String(consumedAtRaw));
    if (Number.isNaN(consumed_at.getTime())) {
      throw new BadRequestException('consumed_at must be a valid date/time');
    }

    try {
      // ensure PlayerStats row exists
      const ps = await this.playerStatsModel.findByPk(player_stats_id);
      if (!ps) throw new NotFoundException('player_stats not found');

      // try to find an identical meal (same player, same food, same timestamp)
      let meal = await this.mealModel.findOne({
        where: {
          player_stats_id,
          food: { [Op.iLike]: food },
          consumed_at,
        },
      });

      if (!meal) {
        const recTime =
          String(body?.recommended_time ?? '').trim() || '00:00:00';
        const calsStr = String(body?.calories ?? '').trim();
        const calories = calsStr === '' ? undefined : Number(calsStr);

        meal = await this.mealModel.create({
          player_stats_id,
          is_recommended: !!body?.is_recommended,
          food,
          recommended_time: recTime, // string
          consumed_at, // Date
          calories, // number | undefined
        } as unknown as CreationAttributes<Meal>);
      }

      return {
        ok: true,
        data: {
          id: meal.dataValues.id,
          player_stats_id: meal.dataValues.player_stats_id,
          is_recommended: Boolean(meal.dataValues.is_recommended),
          food: meal.dataValues.food,
          recommended_time: meal.dataValues.recommended_time ?? null,
          consumed_at:
            meal.dataValues.consumed_at instanceof Date
              ? meal.dataValues.consumed_at.toISOString()
              : String(meal.dataValues.consumed_at),
          calories:
            meal.dataValues.calories == null
              ? null
              : Number(meal.dataValues.calories),
        },
      };
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'Failed to save meal.';
      throw new UnauthorizedException(msg);
    }
  }

  // GET: by id (from body)
  @Get()
  async getByPk(@Body() body: { id: string }): Promise<mealResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    try {
      const meal = await this.mealModel.findByPk(id);
      if (!meal) throw new NotFoundException('meal not found!');

      return {
        ok: true,
        data: {
          id: meal.dataValues.id,
          player_stats_id: meal.dataValues.player_stats_id,
          is_recommended: Boolean(meal.dataValues.is_recommended),
          food: meal.dataValues.food,
          recommended_time: meal.dataValues.recommended_time ?? null,
          consumed_at:
            meal.dataValues.consumed_at instanceof Date
              ? meal.dataValues.consumed_at.toISOString()
              : String(meal.dataValues.consumed_at),
          calories:
            meal.dataValues.calories == null
              ? null
              : Number(meal.dataValues.calories),
        },
      };
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'Failed to get meal.';
      throw new UnauthorizedException(msg);
    }
  }

  // PATCH: by id; only update provided fields (simple checks)
  @Patch()
  async patch(
    @Body()
    body: patchMealRequest,
  ): Promise<mealResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    const src = body && typeof body.data === 'object' ? body.data : body;
    const updates: Record<string, any> = {};

    if ('is_recommended' in src) {
      updates.is_recommended = Boolean(
        (src as patchMealRequest).is_recommended,
      );
    }

    if ('food' in src) {
      const f = String((src as patchMealRequest).food ?? '').trim();
      if (!f) throw new BadRequestException('food cannot be empty');
      updates.food = f;
    }

    if ('recommended_time' in src) {
      const rt = (src as patchMealRequest).recommended_time;
      updates.recommended_time = rt == null ? null : String(rt).trim() || null;
    }

    if ('consumed_at' in src) {
      const cRaw = (src as patchMealRequest).consumed_at;
      const c = cRaw instanceof Date ? cRaw : new Date(String(cRaw));
      if (Number.isNaN(c.getTime())) {
        throw new BadRequestException('consumed_at must be a valid date/time');
      }
      updates.consumed_at = c;
    }

    if ('calories' in src) {
      const cal = (src as patchMealRequest).calories;
      updates.calories =
        cal == null || String(cal).trim() === '' ? null : Number(cal);
      if (updates.calories != null && !Number.isFinite(updates.calories)) {
        throw new BadRequestException('calories must be a number');
      }
    }

    try {
      const meal = await this.mealModel.findByPk(id);
      if (!meal) throw new NotFoundException('meal not found');

      if (Object.keys(updates).length > 0) {
        await meal.update(updates);
        await meal.reload();
      }

      return {
        ok: true,
        data: {
          id: meal.dataValues.id,
          player_stats_id: meal.dataValues.player_stats_id,
          is_recommended: Boolean(meal.dataValues.is_recommended),
          food: meal.dataValues.food,
          recommended_time: meal.dataValues.recommended_time ?? null,
          consumed_at:
            meal.dataValues.consumed_at instanceof Date
              ? meal.dataValues.consumed_at.toISOString()
              : String(meal.dataValues.consumed_at),
          calories:
            meal.dataValues.calories == null
              ? null
              : Number(meal.dataValues.calories),
        },
      };
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'Failed to update meal.';
      throw new UnauthorizedException(msg);
    }
  }

  // DELETE: by id (param)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<{ ok: boolean; data: { id: string; food: string } }> {
    try {
      const meal = await this.mealModel.findByPk(id);
      if (!meal) throw new NotFoundException('meal not found');

      const res = { id: meal.id, food: meal.food };
      await meal.destroy();

      return { ok: true, data: res };
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'Failed to delete meal.';
      throw new UnauthorizedException(msg);
    }
  }
}
