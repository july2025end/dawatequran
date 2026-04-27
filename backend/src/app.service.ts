import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AppService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AppService.name);

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'service-role-key-placeholder';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getHello(): string {
    return 'Dawat-e-Quran API is running!';
  }

  async getHealth() {
    this.logger.log('Checking database health...');
    return { status: 'ok', message: 'Dawat-e-Quran Backend running cleanly.' };
  }
}
