import { Test, TestingModule } from '@nestjs/testing';
import { FraudService } from './fraud.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FraudAggregateSpecification } from './specifications/fraud-aggregate.specification';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('FraudService', () => {
  let service: FraudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: FraudAggregateSpecification,
          useValue: {},
        },
        {
          provide: EventEmitter2,
          useValue: {
            emitAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FraudService>(FraudService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
