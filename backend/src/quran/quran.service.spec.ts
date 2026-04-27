import { Test, TestingModule } from '@nestjs/testing';
import { QuranService } from './quran.service';

describe('QuranService', () => {
  let service: QuranService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuranService],
    }).compile();

    service = module.get<QuranService>(QuranService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
