import { Test, TestingModule } from '@nestjs/testing';
import { AcademiasController } from './academias.controller';
import { AcademiasService } from './academias.service';

describe('AcademiasController', () => {
  let controller: AcademiasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademiasController],
      providers: [AcademiasService],
    }).compile();

    controller = module.get<AcademiasController>(AcademiasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
