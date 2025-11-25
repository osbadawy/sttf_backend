// src/modules/coach-assessment/coach-assessment.controller.ts
import { Body, Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CoachAssessmentService } from '../services/coach_assessment.service';
import { DbUser } from 'src/auth/db-user.decorator';
import { User } from '../models/user.model';
import {
  CoachAssessmentRequest,
  GetCoachAssessmentsForDate,
  GetCoachAssessmentsForAllPlayersOnDayQuery,
} from '../dtos/request.dtos';
import { Roles } from 'src/auth/roles.decorator';
import { UserAccessGuard } from 'src/auth/user-access.guard';
import { validatePlayerFirebaseId } from 'src/auth/auth.utils';
import { IgnoreRoles } from 'src/auth/roles.decorator';

@ApiTags('Coach Assessment')
@ApiBearerAuth('firebase-auth')
@Controller('coach-assessment')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class CoachAssessmentController {
  constructor(
    private readonly coachAssessmentService: CoachAssessmentService,
  ) {}

  @Post('/')
  @IgnoreRoles('player')
  @ApiOperation({
    summary: 'Create coach assessment (Coach only)',
    description:
      '**Roles:** coach\n\n' +
      '**Access:** Only coaches can create assessments for any player\n\n' +
      '**Restrictions:** Players, nutritionists, and admins cannot create coach assessments',
  })
  @ApiResponse({
    status: 201,
    description: 'Coach assessment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Coach role required' })
  async createCoachAssessment(
    @Body() body: CoachAssessmentRequest,
    @DbUser() user: User,
  ) {
    return this.coachAssessmentService.createCoachAssessment(body, user.id);
  }

  @Get('/day')
  @ApiOperation({
    summary: 'Get coach assessments for a date',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own coach assessments (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view coach assessments for any player by specifying firebase_id',
  })
  @ApiResponse({
    status: 200,
    description: 'Coach assessments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own assessments',
  })
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
  @ApiOperation({
    summary: 'Get coach assessments for all players on a day (Staff only)',
    description:
      '**Roles:** admin, coach, nutritionist\n\n' +
      '**Access:** Staff members can retrieve coach assessments for all players on a specific day\n\n' +
      '**Restrictions:** Players cannot access this endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Coach assessments for all players retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players cannot access',
  })
  async getCoachAssessmentsForAllPlayersOnDay(
    @Query() query: GetCoachAssessmentsForAllPlayersOnDayQuery,
  ) {
    return this.coachAssessmentService.getCoachAssessmentsForAllPlayersOnDay(
      query,
    );
  }
}
