import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('Body Composition')
@ApiBearerAuth('firebase-auth')
@Controller('body-composition')
@UseGuards(FirebaseAuthGuard, UserAccessGuard, RolesGuard)
export class BodyCompositionController {
  constructor(
    private readonly bodyCompositionService: BodyCompositionService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get body compositions',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own body composition data (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view body composition data for any player by specifying firebase_id',
  })
  @ApiResponse({
    status: 200,
    description: 'Body compositions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own data',
  })
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
  @ApiOperation({
    summary: 'Get latest body composition values',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only view their own latest body composition values (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can view latest body composition values for any player by specifying firebase_id',
  })
  @ApiParam({ name: 'firebase_id', description: 'Firebase user ID' })
  @ApiResponse({
    status: 200,
    description: 'Latest body composition values retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only view their own data',
  })
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
  @ApiOperation({
    summary: 'Create body composition',
    description:
      '**Roles:** All authenticated users (player, coach, nutritionist, admin)\n\n' +
      '**Access:**\n' +
      '- **Players:** Can only create body composition data for themselves (firebase_id must match authenticated user)\n' +
      '- **Staff:** Can create body composition data for any player by specifying firebase_id',
  })
  @ApiResponse({
    status: 201,
    description: 'Body composition created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Players can only create their own data',
  })
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
