import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { WhoopController } from './whoop.controller';
import { WhoopUserService, WhoopCycleService } from './services';
import { FIREBASE_ADMIN } from '../auth/firebase-admin.provider';

describe('WhoopController', () => {
  let controller: WhoopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhoopController],
      providers: [
        {
          provide: WhoopUserService,
          useValue: {
            createWhoopUser: jest.fn(),
          },
        },
        {
          provide: WhoopCycleService,
          useValue: {
            createCycles: jest.fn(),
          },
        },
        {
          provide: FIREBASE_ADMIN,
          useValue: {
            auth: jest.fn().mockReturnValue({
              verifyIdToken: jest.fn(),
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WhoopController>(WhoopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
