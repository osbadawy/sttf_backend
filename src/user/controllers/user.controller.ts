import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Get,
  Patch,
  UseGuards,
  UnauthorizedException,
  Query,
  Req,
  Param,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { SignUpResponse, playerWithPlansResponse } from '../dtos/response.dtos';
import { UserService } from '../services/user.service';

import type { SignUpBodyRequest } from '../dtos/request.dtos';
import {
  GetPlayerDayPlanQuery,
  PatchUserBodyRequest,
} from '../dtos/request.dtos';

@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUserByPk(@Req() req: Request & { user: { uid: string } }) {
    return await this.userService.getUser(req.user.uid);
  }

  @Get('/players')
  async getPlayers() {
    return await this.userService.getPlayers();
  }

  @Patch()
  async patchUserByPk(
    @Body() body: PatchUserBodyRequest,
    @Req() req: Request & { user: { uid: string } },
  ) {
    return await this.userService.patchUserByPk(body, req.user.uid);
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
}
