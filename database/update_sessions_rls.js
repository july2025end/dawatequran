const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function updateSessionsRLS() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    await client.query(`
      CREATE POLICY "Public Read Access for Sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);
    `);
    
    console.log('✅ Updated Sessions RLS policies to allow public read access.');
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
updateSessionsRLS();