import { Test, TestingModule } from '@nestjs/testing';
import { ConstanciasController } from './constancias.controller';
import { ConstanciasService } from './constancias.service';

describe('ConstanciasController', () => {
  let controller: ConstanciasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConstanciasController],
      providers: [ConstanciasService],
    }).compile();

    controller = module.get<ConstanciasController>(ConstanciasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
