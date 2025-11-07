import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/debug-sentry')
  @ApiOperation({ summary: 'Trigger a Sentry error for testing' })
  @ApiResponse({
    status: 500,
    description: 'Throws an error for Sentry testing',
  })
  getError() {
    throw new Error('My first Sentry error!');
  }
}
