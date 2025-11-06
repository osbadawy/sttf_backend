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
import { UserAccessGuard } from '../../auth/user-access.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { DbUser } from '../../auth/db-user.decorator';
import { validatePlayerFirebaseId } from '../../auth/auth.utils';
import { User } from '../models/user.model';
import { BodyCompositionService } from '../services/body_composition.service';
import {
  GetBodyCompositionsQuery,
  CreateBodyCompositionRequest,
} from '../dtos/request.dtos';

@Controller('body-composition')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class BodyCompositionController {
  constructor(
    private readonly bodyCompositionService: BodyCompositionService,
  ) {}

  @Get()
  async getBodyCompositions(
    @Query() query: GetBodyCompositionsQuery,
    @DbUser() user: User,
  ) {
    validatePlayerFirebaseId(
      user,
      query.firebase_id,
      'Players can only view their own body composition data',
    );

    return await this.bodyCompositionService.getBodyCompositions(query);
  }

  @Get('latest/:firebase_id')
  async getLatestBodyCompositionValues(
    @Param('firebase_id') firebase_id: string,
    @DbUser() user: User,
  ) {
    validatePlayerFirebaseId(
      user,
      firebase_id,
      'Players can only view their own latest body composition values',
    );

    return await this.bodyCompositionService.getLatestBodyCompositionValues(
      firebase_id,
    );
  }

  @Post()
  async createBodyComposition(
    @Body() body: CreateBodyCompositionRequest,
    @DbUser() user: User,
  ) {
    validatePlayerFirebaseId(
      user,
      body.firebase_id,
      'Players can only create body composition data for themselves',
    );

    return await this.bodyCompositionService.createBodyComposition(body);
  }
}
