import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuranService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(QuranService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY') || '';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getSyllabus() {
    this.logger.log('Fetching syllabus topics...');
    const { data, error } = await this.supabase
      .from('syllabus_topics')
      .select('*')
      .order('topic_number', { ascending: true });
      
    if (error) {
      this.logger.error(`Error fetching syllabus: ${error.message}`);
      throw error;
    }
    return data;
  }

  async getParticipants(circleId: string) {
    this.logger.log(`Fetching participants for circle ${circleId}...`);
    const { data, error } = await this.supabase
      .from('participants')
      .select('*')
      .eq('circle_id', circleId)
      .eq('is_active', true);
      
    if (error) {
      this.logger.error(`Error fetching participants: ${error.message}`);
      throw error;
    }
    return data;
  }

  async getDashboardStats() {
    // In a real scenario, this would aggregate data across multiple tables.
    // For now, we return mock aggregated data structure.
    return {
      totalCircles: 42,
      classesHeldThisWeek: 38,
      avgAttendance: 78,
      lowActivityCircles: 4
    };
  }
}
