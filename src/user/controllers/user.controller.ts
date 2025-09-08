import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  Body,
  Controller,
  Post,
  Get,
  Patch,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { UniqueConstraintError } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { SignUpResponse, getUserResponse } from '../dtos/response.dtos';

import type {
  SignUpBodyRequest,
  getUserPkRequest,
  PatchUserFieldsRequest,
  PatchUserBodyRequest,
} from '../dtos/request.dtos';

@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  @Get()
  async getUserByPk(@Body() body: getUserPkRequest): Promise<getUserResponse> {
    const id = body.id;

    if (!id) throw new BadRequestException('id is required');

    try {
      const user = await this.userModel.findByPk(id);
      if (!user) throw new NotFoundException('user not found!');

      const data: getUserResponse['data'] = {
        email: user.email,
        avatar_url: user.avatar_url ?? '',
        age: user.age ?? 0,
        phone: user.phone ?? 0,
        nationality: user.nationality ?? '',
        display_name: user.display_name ?? '',
      };

      return { ok: true, data };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to get user.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  @Patch()
  async patchUserByPk(
    @Body() body: PatchUserBodyRequest,
  ): Promise<getUserResponse> {
    const id = String(body?.id ?? '').trim();
    if (!id) throw new BadRequestException('id is required');

    try {
      const user = await this.userModel.findByPk(id);
      if (!user) throw new NotFoundException('user not found!');

      const src: PatchUserFieldsRequest =
        body && typeof body.data === 'object' ? body.data : body;

      const updates: Record<string, any> = {};

      if ('email' in src) {
        const email = (src.email ?? '').trim().toLowerCase();
        if (!email) throw new BadRequestException('email cannot be empty');
        updates.email = email;
      }
      if ('avatar_url' in src) updates.avatar_url = src.avatar_url ?? null;
      if ('display_name' in src)
        updates.display_name = src.display_name ?? null;
      if ('nationality' in src) updates.nationality = src.nationality ?? null;

      if ('age' in src) {
        const ageNum = Number(src.age);
        if (!Number.isFinite(ageNum) || ageNum < 0)
          throw new BadRequestException('age must be a non-negative number');
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
            throw new ConflictException('Email already in use.');
          }
          throw err;
        }
      }

      const data: getUserResponse['data'] = {
        email: user.email,
        avatar_url: user.avatar_url ?? '',
        age: user.age ?? 0,
        phone: user.phone ?? 0,
        nationality: user.nationality ?? '',
        display_name: user.display_name ?? '',
      };

      return { ok: true, data };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to update user.';
      throw new UnauthorizedException(errorMessage);
    }
  }

  @Post('signup')
  async signUp(@Body() body: SignUpBodyRequest): Promise<SignUpResponse> {
    const firebase_id = (body?.firebase_id ?? '').trim();
    const email = (body?.email ?? '').trim().toLowerCase();

    if (!firebase_id) throw new BadRequestException('firebase_id is required');
    if (!email) throw new BadRequestException('email is required');

    try {
      let user = await this.userModel.findOne({ where: { firebase_id } });

      if (!user) {
        user = await this.userModel.create({ firebase_id, email });
        return { created: true, user: { firebase_id, email: user.email } };
      }

      if (user.email !== email) {
        await user.update({ email });
      }

      return { created: false, user: user };
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to save user.';
      throw new UnauthorizedException(errorMessage);
    }
  }
}
