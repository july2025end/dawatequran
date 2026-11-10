const { Client } = require('pg');
// Run with: node --env-file=database/.env database/add_update_policy.js  (copy database/.env.example to database/.env)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set. See database/.env.example.');

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
