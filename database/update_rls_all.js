const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function updateRLSAll() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Temporarily allow public ALL access to participants, syllabus, and sessions so the frontend can edit without auth
    await client.query(`
      CREATE POLICY "Public All Access for Participants" ON participants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
      CREATE POLICY "Public All Access for Syllabus" ON syllabus_topics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
      CREATE POLICY "Public All Access for Sessions" ON sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    `);
    
    console.log('✅ Updated RLS policies to allow public ALL access.');
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
updateRLSAll();