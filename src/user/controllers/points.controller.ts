// src/modules/coach-assessment/coach-assessment.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { DailyPointsService } from '../services/daily_points.service';

@Controller('points')
@UseGuards(FirebaseAuthGuard)
export class PointsController {
  constructor(private readonly dailyPointsService: DailyPointsService) {}

  @Get('/week/leaderboard')
  async getDailyPointsForDate() {
    return this.dailyPointsService.getLeaderboardForWeek();
  }

  @Get('/week')
  async getPointsForWeek(@Req() req: Request & { user: { uid: string } }) {
    return this.dailyPointsService.getPointsThisWeek(req.user.uid);
  }
}
