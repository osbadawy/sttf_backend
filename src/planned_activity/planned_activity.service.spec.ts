import { Test, TestingModule } from '@nestjs/testing';
import { PlannedActivityService } from './planned_activity.service';

describe('PlannedActivityService', () => {
  let service: PlannedActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlannedActivityService],
    }).compile();

    service = module.get<PlannedActivityService>(PlannedActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
