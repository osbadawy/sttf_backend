import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { User } from '../models/user.model';
import { PlayerStats } from '../models/player_stats.model';
import { SignUpResponse, getUserResponse } from '../dtos/response.dtos';
import type {
  SignUpBodyRequest,
  getUserPkRequest,
  PatchUserFieldsRequest,
  PatchUserBodyRequest,
} from '../dtos/request.dtos';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(PlayerStats)
    private readonly playerStatsModel: typeof PlayerStats,
  ) {}

  async getUserByPk(body: getUserPkRequest): Promise<getUserResponse> {
    const id = body.id;

    if (!id) throw new Error('id is required');

    const user = await this.userModel.findByPk(id);
    if (!user) throw new Error('user not found!');

    const data: getUserResponse['data'] = {
      email: user.email,
      avatar_url: user.avatar_url ?? undefined,
      access: user.access ?? 'player',
      birth_date: user.birth_date ?? undefined,
      phone: user.phone ?? undefined,
      nationality: user.nationality ?? undefined,
      display_name: user.display_name ?? undefined,
    };

    return { ok: true, data };
  }

  async getPlayers() {
    const players = await this.userModel.findAll({
      where: { access: 'player' },
    });
    return players;
  }

  async patchUserByPk(body: PatchUserBodyRequest): Promise<getUserResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new Error('id is required');

    const user = await this.userModel.findByPk(id);
    if (!user) throw new Error('user not found!');

    const src: PatchUserFieldsRequest =
      body && typeof body.data === 'object' ? body.data : body;

    const updates: Record<string, any> = {};

    if ('email' in src) {
      const email = (src.email ?? '').trim().toLowerCase();
      if (!email) throw new Error('email cannot be empty');
      updates.email = email;
    }
    if ('avatar_url' in src) updates.avatar_url = src.avatar_url ?? null;
    if ('display_name' in src)
      updates.display_name = src.display_name ?? null;
    if ('nationality' in src) updates.nationality = src.nationality ?? null;

    if ('age' in src) {
      const ageNum = Number(src.age);
      if (!Number.isFinite(ageNum) || ageNum < 0)
        throw new Error('age must be a non-negative number');
      updates.age = Math.floor(ageNum);
    }

    if ('phone' in src) {
      const digits = src.phone ?? '';
      updates.phone = digits ? Number(digits) : null;
    }

    if (Object.keys(updates).length > 0) {
      try {
        await user.update(updates);
      } catch (err: any) {
        if (err instanceof UniqueConstraintError) {
          throw new Error('Email already in use.');
        }
        throw err;
      }
    }

    const data: getUserResponse['data'] = {
      email: user.email,
      avatar_url: user.avatar_url ?? undefined,
      birth_date: user.birth_date ?? undefined,
      access: user.access ?? 'player',
      phone: user.phone ?? undefined,
      nationality: user.nationality ?? undefined,
      display_name: user.display_name ?? undefined,
    };

    return { ok: true, data };
  }

  async signUp(body: SignUpBodyRequest): Promise<SignUpResponse> {
    const firebase_id = (body?.firebase_id ?? '').trim();
    const email = (body?.email ?? '').trim().toLowerCase();
    const access = (body?.access ?? 'player').trim().toLowerCase();

    if (!firebase_id) throw new Error('firebase_id is required');
    if (!email) throw new Error('email is required');
    if (!access) throw new Error('access is required');

    let user = await this.userModel.findOne({ where: { firebase_id } });

    if (!user) {
      const createData: {
        firebase_id: string;
        email: string;
        access: string;
        player_stats?: PlayerStats;
      } = { firebase_id, email, access };

      // Include player_stats creation for players
      if (access === 'player') {
        createData.player_stats = {} as PlayerStats;
      }

      user = await this.userModel.create(createData, {
        include: access === 'player' ? [{ model: PlayerStats }] : undefined,
      });

      return {
        created: true,
        user: { firebase_id, email: user.email, access },
      };
    }

    if (user.email !== email) {
      await user.update({ email });
    }

    return {
      created: false,
      user: {
        firebase_id: user.firebase_id,
        email: user.email,
        access: user.access ?? 'player',
      },
    };
  }

  async logIn(
    body: SignUpBodyRequest,
    session: { user?: { access?: unknown } },
  ): Promise<getUserResponse> {
    const email = (body?.email ?? '').trim().toLowerCase();

    if (!email) throw new Error('email is required');

    const user = await this.userModel.findOne({ where: { email } });

    if (!user) {
      throw new Error('user not found');
    }
    if (!user.access) {
      throw new Error('access not found');
    }

    // avoid .access on an `any` by using a typed local
    session.user = { access: user.access };

    const data: getUserResponse['data'] = {
      email: user.email,
      avatar_url: user.avatar_url ?? undefined,
      access: user.access ?? 'player',
      birth_date: user.birth_date ?? undefined,
      phone: user.phone ?? undefined,
      nationality: user.nationality ?? undefined,
      display_name: user.display_name ?? undefined,
    };
    return { ok: false, data };
  }
}
