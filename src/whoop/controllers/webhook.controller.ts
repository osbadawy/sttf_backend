// whoop.controller.ts
import { Controller, Req, Res, UseGuards, Post } from '@nestjs/common';
import type { Response } from 'express';
import { WhoopWebhookService } from 'src/whoop/services';
import { WhoopWebhookAccessTokenGuard } from 'src/whoop/guards';

@Controller('whoop/webhook')
export class WhoopWebhookController {
  constructor(private readonly whoopWebhookService: WhoopWebhookService) {}

  @UseGuards(WhoopWebhookAccessTokenGuard)
  @Post('/')
  async whoopWebhook(@Req() req: Request, @Res() res: Response) {
    // await this.whoopWebhookService.handleWebhook(req.body);
    // return res.json({ ok: true });
    console.log('Made it to main controller');
    return res.json(req.body);
  }
}
