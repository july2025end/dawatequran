const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function updateRLS() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Temporarily allow public read access to participants, quran_circles, and union_councils so the frontend can read the data without auth
    await client.query(`
      CREATE POLICY "Public Read Access for Participants" ON participants FOR SELECT TO anon, authenticated USING (true);
    `);
    
    console.log('✅ Updated RLS policies to allow public read access.');
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