// src/modules/player-self-assessment/player-self-assessment.controller.ts
import { Body, Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('Player Self Assessment')
@ApiBearerAuth('firebase-auth')
@Controller('player-self-assessment')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class PlayerSelfAssessmentController {
  constructor(
    private readonly playerSelfAssessmentService: PlayerSelfAssessmentService,
  ) {}

  // Only players can create self assessments (staff cannot)
  @IgnoreRoles('admin', 'coach', 'nutritionist')
  @Post('/')
  @ApiOperation({
    summary: 'Create player self assessment (Players only)',
    description:
      '**Roles:** player\n\n' +
      '**Access:** Only players can create self assessments for themselves\n\n' +
      '**Restrictions:** Staff members (admin, coach, nutritionist) cannot create self assessments',
  })
  @ApiResponse({
    status: 201,
    description: 'Self assessment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Staff cannot create self assessments',
  })
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
  @ApiOperation({
    summary: 'Get player self assessments for a date',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own self assessments (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view self assessments for any player by specifying firebase_id',
  })
  @ApiResponse({
    status: 200,
    description: 'Self assessments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own assessments',
  })
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
