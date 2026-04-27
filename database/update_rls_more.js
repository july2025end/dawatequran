const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function updateRLS() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Allow public read on union_councils and quran_circles
    await client.query(`
      CREATE POLICY "Public Read Access for UCs Anon" ON union_councils FOR SELECT TO anon, authenticated USING (true);
      CREATE POLICY "Public Read Access for Circles Anon" ON quran_circles FOR SELECT TO anon, authenticated USING (true);
    `);
    
    console.log('✅ Updated RLS policies for UCs and Circles.');
  } catch (e) {
    if (e.message.includes('already exists')) {
       console.log('✅ Policy already exists.');
    } else {
       console.error(e);
    }
  } finally {
    await client.end();
  }
}
updateRLS();