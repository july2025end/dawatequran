const { Client } = require('pg');
// Run with: node --env-file=database/.env database/update_sessions_rls.js  (copy database/.env.example to database/.env)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set. See database/.env.example.');

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