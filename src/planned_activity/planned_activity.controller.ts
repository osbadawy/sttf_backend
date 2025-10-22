import { Controller, Get, Post, Patch, Body, Req, Param, Query } from '@nestjs/common';
import { PlannedActivityService } from './planned_activity.service';
import { CompletePlannedActivityRequest, CreatePlannedActivityBodyRequest, GetPlannedActivitiesQuery, UpdatePlannedActivityBodyRequest } from './dtos/request.dto';
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
    @Patch("")
    async updatePlannedActivity(
        @Body() body: UpdatePlannedActivityBodyRequest, 
        @Req() req: Request & { user: { uid: string } }
    ){
        return this.plannedActivityService.updatePlannedActivity(body, req.user.uid);
    }


    //Get planned activities based on players and day
    @Get()
    async getPlannedActivities(@Query() query: GetPlannedActivitiesQuery){
        return this.plannedActivityService.getPlannedActivities(query);
    }

    //Gets a planned activity by id
    @Get("/:id")
    async getPlannedActivityById(@Param('id') id: string){
        return this.plannedActivityService.getPlannedActivityById(id);
    }

    //Player completes a planned activity
    @Post("/player-self-assessment")
    async completePlannedActivity(@Body() body: CompletePlannedActivityRequest, @Req() req: Request & { user: { uid: string } }){
        return this.plannedActivityService.completePlannedActivity(body, req.user.uid);
    }

}
