import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { WhoopService } from './whoop.service';
import { WhoopAuth } from './models/whoop_auth.model';
import { User } from '../user/models/user.model';

describe('WhoopService', () => {
  let service: WhoopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhoopService,
        {
          provide: getModelToken(WhoopAuth),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getModelToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WhoopService>(WhoopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
