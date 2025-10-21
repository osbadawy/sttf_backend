import { Test, TestingModule } from '@nestjs/testing';
import { PlannedActivityController } from './planned_activity.controller';

describe('PlannedActivityController', () => {
  let controller: PlannedActivityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlannedActivityController],
    }).compile();

    controller = module.get<PlannedActivityController>(
      PlannedActivityController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
