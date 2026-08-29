const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function migrate() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB');

    await client.query(`
      CREATE POLICY "Public Update for Attendance" ON attendance FOR UPDATE TO anon, authenticated USING (true);
      CREATE POLICY "Public Delete for Attendance" ON attendance FOR DELETE TO anon, authenticated USING (true);
      
      CREATE POLICY "Public Update for Sessions" ON sessions FOR UPDATE TO anon, authenticated USING (true);
      CREATE POLICY "Public Delete for Sessions" ON sessions FOR DELETE TO anon, authenticated USING (true);
    `);
    
    console.log('Added UPDATE/DELETE policies to attendance and sessions.');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Policies already exist.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    await client.end();
  }
}

migrate();
