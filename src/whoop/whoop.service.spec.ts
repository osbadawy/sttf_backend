import { Test, TestingModule } from '@nestjs/testing';
import { WhoopService } from './whoop.service';

describe('WhoopService', () => {
  let service: WhoopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhoopService],
    }).compile();

    service = module.get<WhoopService>(WhoopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
