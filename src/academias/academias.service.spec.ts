import { Test, TestingModule } from '@nestjs/testing';
import { AcademiasService } from './academias.service';

describe('AcademiasService', () => {
  let service: AcademiasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademiasService],
    }).compile();

    service = module.get<AcademiasService>(AcademiasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
