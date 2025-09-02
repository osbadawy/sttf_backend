import { Test, TestingModule } from '@nestjs/testing';
import { WhoopController } from './whoop.controller';

describe('WhoopController', () => {
  let controller: WhoopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhoopController],
    }).compile();

    controller = module.get<WhoopController>(WhoopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
