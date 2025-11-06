// src/modules/coach-assessment/coach-assessment.controller.ts
import { Body, Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CoachAssessmentService } from '../services/coach_assessment.service';
import { DbUser } from 'src/auth/db-user.decorator';
import { User } from '../models/user.model';
import {
  CoachAssessmentRequest,
  GetCoachAssessmentsForDate,
  GetCoachAssessmentsForAllPlayersOnDayQuery
} from '../dtos/request.dtos';
import { Roles } from 'src/auth/roles.decorator';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { validatePlayerFirebaseId } from 'src/auth/auth.utils';
import { IgnoreRoles } from 'src/auth/roles.decorator';

@Controller('coach-assessment')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class CoachAssessmentController {
  constructor(
    private readonly coachAssessmentService: CoachAssessmentService,
  ) {}

  @Post('/')
  @Roles('coach')
  async createCoachAssessment(
    @Body() body: CoachAssessmentRequest,
    @DbUser() user: User,
  ) {
    return this.coachAssessmentService.createCoachAssessment(
      body,
      user.id,
    );
  }

  @Get('/day')
  async getCoachAssessmentsForDate(
    @Query() query: GetCoachAssessmentsForDate,
    @DbUser() user: User,
  ) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own coach assessments',
    );

    return this.coachAssessmentService.getCoachAssessmentsForDate(query);
  }

  @Get('/day/all')
  @IgnoreRoles('player')
  async getCoachAssessmentsForAllPlayersOnDay(
    @Query() query: GetCoachAssessmentsForAllPlayersOnDayQuery,
  ) {
    return this.coachAssessmentService.getCoachAssessmentsForAllPlayersOnDay(query);
  }
}
