// src/modules/player-self-assessment/player-self-assessment.controller.ts
import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlayerSelfAssessment } from '../models/player_self_assessment.model';

import {
  PlayerCreateSelfAssessmentRequest,
  GetPlayerSelfAssessmentsForDate,
} from '../dtos/request.dtos';
import { PlayerSelfAssessmentService } from '../services/player_self_assessment.service';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { DbUser } from 'src/auth/db-user.decorator';
import { IgnoreRoles } from 'src/auth/roles.decorator';
import { validatePlayerFirebaseId } from 'src/auth/auth.utils';
import { User } from '../models/user.model';

@Controller('player-self-assessment')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class PlayerSelfAssessmentController {
  constructor(
    private readonly playerSelfAssessmentService: PlayerSelfAssessmentService,
  ) {}

  // Only players can create self assessments (staff cannot)
  @IgnoreRoles('admin', 'coach', 'nutritionist')
  @Post('/')
  async createPlayerSelfAssessment(
    @Body() body: PlayerCreateSelfAssessmentRequest,
    @DbUser() user: User,
  ): Promise<PlayerSelfAssessment> {
    return this.playerSelfAssessmentService.createSelfAssessment(
      body,
      user.firebase_id,
    );
  }

  // Staff can view any player's assessments, players can only view their own
  @Get('/day')
  async getPlayerSelfAssessmentsForDate(
    @Query() query: GetPlayerSelfAssessmentsForDate,
    @DbUser() user: User,
  ): Promise<PlayerSelfAssessment[]> {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own self assessments',
    );

    return this.playerSelfAssessmentService.getPlayerSelfAssessmentsForDate(
      query,
    );
  }
}
