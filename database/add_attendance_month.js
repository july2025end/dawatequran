const { Client } = require('pg');
// Run with: node --env-file=database/.env database/add_attendance_month.js  (copy database/.env.example to database/.env)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set. See database/.env.example.');

async function migrate() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB');

    try {
      await client.query(`ALTER TABLE sessions ADD COLUMN attendance_month VARCHAR(20);`);
      console.log('Added attendance_month to sessions table.');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('attendance_month already exists in sessions.');
      } else {
        throw e;
      }
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
