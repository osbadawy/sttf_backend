import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { playerWithPlansResponse } from '../dtos/response.dtos';
import { UserService } from '../services/user.service';

import {
  SignUpBodyRequest,
  GetPlayerDayPlanQuery,
  PatchUserBodyRequest,
} from '../dtos/request.dtos';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { IgnoreRoles } from 'src/auth/roles.decorator';
import { DbUser } from 'src/auth/db-user.decorator';
import { User } from '../models/user.model';
import { validatePlayerFirebaseId } from 'src/auth/auth.utils';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  async getUserByPk(@Req() req: Request & { user: { uid: string } }) {
    return await this.userService.getUser(req.user.uid);
  }

  // Only staff can get all players
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  @IgnoreRoles('player')
  @Get('/players')
  async getPlayers() {
    return await this.userService.getPlayers();
  }

  @Patch()
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  async patchUserByPk(
    @Body() body: PatchUserBodyRequest,
    @Req() req: Request & { user: { uid: string } },
  ) {
    return await this.userService.patchUserByPk(body, req.user.uid);
  }

  // Only staff can get all players week plans
  @IgnoreRoles('player')
  @Get('/players/week')
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  async getPlayersWeekPlans(): Promise<playerWithPlansResponse> {
    const data = await this.userService.getPlayersWeekPlans();
    return { ok: true, data: data };
  }

  @Get('/player/day')
  @UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
  async getPlayerDayPlans(
    @Query() query: GetPlayerDayPlanQuery,
    @DbUser() user: User,
  ) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own day plans',
    );

    return await this.userService.getPlayerDayPlans(query);
  }

  @Post('signup')
  @UseGuards(FirebaseAuthGuard)
  async signUp(
    @Body() body: SignUpBodyRequest,
    @Req() req: Request & { user: { uid: string; email: string } },
  ) {
    return await this.userService.signUp(
      req.user.uid,
      req.user.email,
      body.access,
    );
  }
}
