import { WhoopOAuthGuard, WhoopCallbackGuard } from './whoop.guard';
import { HttpService } from '@nestjs/axios';

describe('WhoopGuard', () => {
  it('should be defined', () => {
    expect(new WhoopOAuthGuard(new HttpService())).toBeDefined();
  });
  it('should be defined', () => {
    expect(new WhoopCallbackGuard(new HttpService())).toBeDefined();
  });
});
