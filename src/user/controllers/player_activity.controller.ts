import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Query,
  Body,
  Param,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { PlayerActivityService } from '../services/player_activity.service';
import {
  GetPlayerActivitiesRequestQuery,
  CreatePlayerActivityRequest,
  CreateSelfAssessmentRequest,
} from '../dtos/request.dtos';

@Controller('player-activity')
@UseGuards(FirebaseAuthGuard)
export class PlayerActivityController {
  constructor(private readonly playerActivityService: PlayerActivityService) {}

  @Get('/')
  async getPlayerActivities(@Query() query: GetPlayerActivitiesRequestQuery) {
    return this.playerActivityService.getPlayerActivities(
      {
        firebase_id: query.firebase_id,
      },
      query.start_date,
      query.end_date,
    );
  }

  @Get('/:id')
  async getPlayerActivityById(@Param('id') id: string) {
    return this.playerActivityService.getPlayerActivityById(id);
  }

  @Post('/')
  async createPlayerActivity(@Body() body: CreatePlayerActivityRequest) {
    return this.playerActivityService.createPlayerActivity(body);
  }

  @Patch('/:id')
  async updatePlayerActivity() {
    // return this.playerActivityService.updatePlayerActivity();
  }

  @Post('self-assessment/')
  async createSelfAssessment(@Body() body: CreateSelfAssessmentRequest) {
    return this.playerActivityService.createSelfAssessment(body);
  }

  @Delete('/:id')
  async deletePlayerActivity() {
    // return this.playerActivityService.deletePlayerActivity();
  }
}
