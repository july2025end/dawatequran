import { Test, TestingModule } from '@nestjs/testing';
import { QuranController } from './quran.controller';

describe('QuranController', () => {
  let controller: QuranController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuranController],
    }).compile();

    controller = module.get<QuranController>(QuranController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
