// src/modules/player-self-assessment/player-self-assessment.controller.ts
import { Body, Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { PlayerSelfAssessment } from '../models/player_self_assessment.model';

import {
  PlayerCreateSelfAssessmentRequest,
  GetPlayerSelfAssessmentsForDate,
} from '../dtos/request.dtos';
import { PlayerSelfAssessmentService } from '../services/player_self_assessment.service';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';

@Controller('player-self-assessment')
@UseGuards(FirebaseAuthGuard)
export class PlayerSelfAssessmentController {
  constructor(
    private readonly playerSelfAssessmentService: PlayerSelfAssessmentService,
  ) {}

  @Post('/')
  async createPlayerSelfAssessment(
    @Body() body: PlayerCreateSelfAssessmentRequest,
  ): Promise<PlayerSelfAssessment> {
    return this.playerSelfAssessmentService.createSelfAssessment(body);
  }

  @Get('/day')
  async getPlayerSelfAssessmentsForDate(
    @Query() query: GetPlayerSelfAssessmentsForDate,
  ): Promise<PlayerSelfAssessment[]> {
    return this.playerSelfAssessmentService.getPlayerSelfAssessmentsForDate(
      query,
    );
  }
}
