const { Client } = require('pg');
// Run with: node --env-file=database/.env database/update_rls_more.js  (copy database/.env.example to database/.env)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set. See database/.env.example.');

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