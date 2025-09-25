import { Controller, Get, Post, Patch, Delete, UseGuards, Query } from "@nestjs/common";
import { FirebaseAuthGuard } from "../../auth/firebase-auth.guard";
import { PlayerActivityService } from "../services/player_activity.service";
import { GetPlayerActivitiesRequestQuery } from "../dtos/request.dtos";

@Controller('player-activity')
// @UseGuards(FirebaseAuthGuard)
export class PlayerActivityController {
  constructor(
    private readonly playerActivityService: PlayerActivityService,
  ) {}


  @Get("/")
  async getPlayerActivities(@Query() query: GetPlayerActivitiesRequestQuery) {
    return this.playerActivityService.getPlayerActivities({
      firebase_id: query.firebase_id,
    }, query.start_date, query.end_date);
  }


  @Post("/")
  async createPlayerActivity() {
    // return this.playerActivityService.createPlayerActivity();
  }

  @Patch("/:id")
  async updatePlayerActivity() {
    // return this.playerActivityService.updatePlayerActivity();
  }

  @Delete("/:id")
  async deletePlayerActivity() {
    // return this.playerActivityService.deletePlayerActivity();
  }
}