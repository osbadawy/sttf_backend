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
import { Op, UniqueConstraintError } from 'sequelize';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { Team } from '../models/team.model';

import type {
  getTeamPkRequest,
  postTeamPkRequest,
  PatchTeamFieldsRequest,
  PatchTeamBodyRequest,
} from '../dtos/team.request.dtos';
import type { getAndPostTeamResponse } from '../dtos/team.response.dtos';

@Controller('team')
@UseGuards(FirebaseAuthGuard)
export class TeamController {
  constructor(@InjectModel(Team) private readonly teamModel: typeof Team) {}

  @Post()
  async signUp(
    @Body() body: postTeamPkRequest,
  ): Promise<getAndPostTeamResponse> {
    const raw = body?.team ?? 'STTF';
    const teamName = String(raw).trim();

    if (!teamName) throw new BadRequestException('team name is required');

    try {
      let teamRecord = await this.teamModel.findOne({
        where: { team: { [Op.iLike]: teamName } },
      });

      if (!teamRecord) {
        try {
          teamRecord = await this.teamModel.create({
            team: teamName,
            totalPlayers: 0,
          });
        } catch (err: any) {
          // If another request created it in-between
          if (err instanceof UniqueConstraintError) {
            teamRecord = await this.teamModel.findOne({
              where: { team: { [Op.iLike]: teamName } },
            });
            if (!teamRecord) throw err;
          } else {
            throw err;
          }
        }
      }

      return {
        ok: true,
        data: {
          id: teamRecord.dataValues.id,
          team: teamRecord.dataValues.team,
          image: teamRecord.dataValues.image ?? '',
          totalPlayers: teamRecord.dataValues.totalPlayers ?? 0,
        },
      };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to save team.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  @Get()
  async getUserByPk(
    @Body() body: getTeamPkRequest,
  ): Promise<getAndPostTeamResponse> {
    const id = body.id;

    if (!id) throw new BadRequestException('id is required');

    try {
      const team = await this.teamModel.findByPk(id);
      if (!team) throw new NotFoundException('team not found!');

      const data: getAndPostTeamResponse['data'] = {
        id: team.id,
        team: team.dataValues.team ?? '',
        image: team.dataValues.image ?? '',
        totalPlayers: team.dataValues.totalPlayers ?? 0,
      };

      return { ok: true, data };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to get team.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  @Patch()
  async patchTeam(
    @Body() body: PatchTeamBodyRequest,
  ): Promise<getAndPostTeamResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    const src: PatchTeamFieldsRequest =
      body && typeof body.data === 'object' ? body.data : body;

    const updates: Record<string, any> = {};

    if ('team' in src) {
      const teamName = (src.team ?? '').trim();
      if (!teamName) throw new BadRequestException('team cannot be empty');
      updates.team = teamName;
    }

    if ('image' in src) {
      const img = (src.image ?? '').toString().trim();
      updates.image = img || null; // store null if empty string
    }

    if ('totalPlayers' in src) {
      const n = Number(src.totalPlayers);
      if (!Number.isFinite(n) || n < 0) {
        throw new BadRequestException(
          'totalPlayers must be a non-negative number',
        );
      }
      updates.totalPlayers = Math.floor(n);
    }

    try {
      const teamRecord = await this.teamModel.findByPk(id);
      if (!teamRecord) throw new NotFoundException('team not found');

      if (Object.keys(updates).length > 0) {
        try {
          await teamRecord.update(updates);
          // Ensure we read the latest DB state (especially useful if DB triggers/defaults run)
          await teamRecord.reload();
        } catch (err: any) {
          if (err instanceof UniqueConstraintError) {
            throw new ConflictException('Team name already exists.');
          }
          throw err;
        }
      }

      return {
        ok: true,
        data: {
          id: teamRecord.dataValues.id,
          team: teamRecord.dataValues.team,
          image: teamRecord.dataValues.image ?? '',
          totalPlayers: teamRecord.dataValues.totalPlayers ?? 0,
        },
      };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to update team.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  @Delete()
  async deleteTeam(
    @Param('id') id: string,
  ): Promise<{ ok: boolean; data: { id: string; team: string } }> {
    try {
      const team = await this.teamModel.findByPk(id);
      if (!team) throw new NotFoundException('team not found');

      const res = { id: team.id, team: team.team };
      await team.destroy();

      return { ok: true, data: res };
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'Failed to delete team.';
      throw new UnauthorizedException(msg);
    }
  }
}
