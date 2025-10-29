import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { BodyCompositionService } from '../services/body_composition.service';
import {
  GetBodyCompositionsQuery,
  CreateBodyCompositionRequest,
} from '../dtos/request.dtos';

@Controller('body-composition')
@UseGuards(FirebaseAuthGuard)
export class BodyCompositionController {
  constructor(
    private readonly bodyCompositionService: BodyCompositionService,
  ) {}

  @Get()
  async getBodyCompositions(@Query() query: GetBodyCompositionsQuery) {
    return await this.bodyCompositionService.getBodyCompositions(query);
  }

  @Get('latest/:firebase_id')
  async getLatestBodyCompositionValues(
    @Param('firebase_id') firebase_id: string,
  ) {
    return await this.bodyCompositionService.getLatestBodyCompositionValues(
      firebase_id,
    );
  }

  @Post()
  async createBodyComposition(@Body() body: CreateBodyCompositionRequest) {
    return await this.bodyCompositionService.createBodyComposition(body);
  }
}
