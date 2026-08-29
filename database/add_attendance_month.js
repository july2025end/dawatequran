const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

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
