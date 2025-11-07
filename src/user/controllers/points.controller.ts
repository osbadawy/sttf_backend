// src/modules/coach-assessment/coach-assessment.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { DailyPointsService } from '../services/daily_points.service';

@ApiTags('Points')
@ApiBearerAuth('firebase-auth')
@Controller('points')
@UseGuards(FirebaseAuthGuard)
export class PointsController {
  constructor(private readonly dailyPointsService: DailyPointsService) {}

  @Get('/week/leaderboard')
  @ApiOperation({
    summary: 'Get weekly leaderboard',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** Shows leaderboard for all players for the current week',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly leaderboard retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDailyPointsForDate() {
    return this.dailyPointsService.getLeaderboardForWeek();
  }

  @Get('/week')
  @ApiOperation({
    summary: 'Get points for the current week',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:** Returns points for the authenticated user for the current week',
  })
  @ApiResponse({
    status: 200,
    description: 'Points for the week retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPointsForWeek(@Req() req: Request & { user: { uid: string } }) {
    return this.dailyPointsService.getPointsThisWeek(req.user.uid);
  }
}
