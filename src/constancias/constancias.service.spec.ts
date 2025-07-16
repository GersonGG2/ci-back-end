import { Test, TestingModule } from '@nestjs/testing';
import { ConstanciasService } from './constancias.service';

describe('ConstanciasService', () => {
  let service: ConstanciasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConstanciasService],
    }).compile();

    service = module.get<ConstanciasService>(ConstanciasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
