import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Query,
  Body,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { PlayerActivityService } from '../services/player_activity.service';
import {
  GetPlayerActivitiesRequestQuery,
  CreatePlayerActivityRequest,
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

  @Post('/')
  async createPlayerActivity(@Body() body: CreatePlayerActivityRequest) {
    return this.playerActivityService.createPlayerActivity(body);
  }

  @Patch('/:id')
  async updatePlayerActivity() {
    // return this.playerActivityService.updatePlayerActivity();
  }

  @Delete('/:id')
  async deletePlayerActivity() {
    // return this.playerActivityService.deletePlayerActivity();
  }
}
