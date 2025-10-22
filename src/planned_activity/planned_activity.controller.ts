import { Controller, Get, Post, Patch, Body, Req, Param } from '@nestjs/common';
import { PlannedActivityService } from './planned_activity.service';
import { CreatePlannedActivityBodyRequest } from './dtos/request.dto';
import { UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';


@Controller('planned-activity')
@UseGuards(FirebaseAuthGuard)
export class PlannedActivityController {
    constructor(
        private readonly plannedActivityService: PlannedActivityService,
    ) {}

    //Coach creates a planned activity for selected players
    @Post()
    async createPlannedActivity(@Body() body: CreatePlannedActivityBodyRequest, @Req() req: Request & { user: { uid: string } }){
        return this.plannedActivityService.createPlannedActivity(body, req.user.uid);
    }

    //Coach updates a planned activity
    @Patch("/:id")
    async updatePlannedActivity(
        @Param('id') id: string,
        @Body() body: CreatePlannedActivityBodyRequest, 
        @Req() req: Request & { user: { uid: string } }
    ){
        return this.plannedActivityService.updatePlannedActivity(id, body, req.user.uid);
    }


    // //Coach gets a planned activity by id
    // @Get("/:id")
    // async getPlannedActivityById(){
    // }


    //Player gets planned activities for selected day
    @Get("/player")
    async getPlannedActivities(){
    }

    //Player completes a planned activity
    @Post("/player/:id")
    async completePlannedActivity(){
    }

}
