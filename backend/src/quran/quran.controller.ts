import { Controller, Get, Param } from '@nestjs/common';
import { QuranService } from './quran.service';

@Controller('api/quran')
export class QuranController {
  constructor(private readonly quranService: QuranService) {}

  @Get('syllabus')
  async getSyllabus() {
    return this.quranService.getSyllabus();
  }

  @Get('participants/:circleId')
  async getParticipants(@Param('circleId') circleId: string) {
    return this.quranService.getParticipants(circleId);
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.quranService.getDashboardStats();
  }
}
