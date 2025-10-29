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
  Query,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import {
  SignUpResponse,
  getUserResponse,
  playerWithPlansResponse,
} from '../dtos/response.dtos';
import { Session } from '@nestjs/common';
import { UserService } from '../services/user.service';

import type {
  SignUpBodyRequest,
  getUserPkRequest,
  PatchUserBodyRequest,
} from '../dtos/request.dtos';
import { GetPlayerDayPlanQuery } from '../dtos/request.dtos';

@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUserByPk(@Body() body: getUserPkRequest): Promise<getUserResponse> {
    try {
      return await this.userService.getUserByPk(body);
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to get user.';
      if (errorMessage.includes('id is required')) {
        throw new BadRequestException(errorMessage);
      }
      if (errorMessage.includes('user not found')) {
        throw new NotFoundException(errorMessage);
      }
      throw new UnauthorizedException(errorMessage);
    }
  }

  @Get('/players')
  async getPlayers() {
    return await this.userService.getPlayers();
  }

  @Patch()
  async patchUserByPk(
    @Body() body: PatchUserBodyRequest,
  ): Promise<getUserResponse> {
    try {
      return await this.userService.patchUserByPk(body);
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to update user.';
      if (
        errorMessage.includes('id is required') ||
        errorMessage.includes('email cannot be empty') ||
        errorMessage.includes('age must be a non-negative number')
      ) {
        throw new BadRequestException(errorMessage);
      }
      if (errorMessage.includes('user not found')) {
        throw new NotFoundException(errorMessage);
      }
      if (errorMessage.includes('Email already in use')) {
        throw new ConflictException(errorMessage);
      }
      throw new UnauthorizedException(errorMessage);
    }
  }

  @Get('/players/week')
  async getPlayersWeekPlans(): Promise<playerWithPlansResponse> {
    const data = await this.userService.getPlayersWeekPlans();
    return { ok: true, data: data };
  }

  @Get('/player/day')
  async getPlayerDayPlans(@Query() query: GetPlayerDayPlanQuery) {
    return await this.userService.getPlayerDayPlans(query);
  }

  @Post('signup')
  async signUp(@Body() body: SignUpBodyRequest): Promise<SignUpResponse> {
    try {
      return await this.userService.signUp(body);
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to save user.';
      if (errorMessage.includes('required')) {
        throw new BadRequestException(errorMessage);
      }
      throw new UnauthorizedException(errorMessage);
    }
  }

  @Post('/login')
  async logIn(
    @Body() body: SignUpBodyRequest,
    @Session() session: { user?: { access?: unknown } },
  ): Promise<getUserResponse> {
    try {
      return await this.userService.logIn(body, session);
    } catch (e: any) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to save user.';
      if (
        errorMessage.includes('email is required') ||
        errorMessage.includes('user not found') ||
        errorMessage.includes('access not found')
      ) {
        throw new BadRequestException(errorMessage);
      }
      throw new UnauthorizedException(errorMessage);
    }
  }
}
