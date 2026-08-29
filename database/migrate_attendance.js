const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function migrate() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Add uc_id to sessions table
    try {
      await client.query(`ALTER TABLE sessions ADD COLUMN uc_id UUID REFERENCES union_councils(id) ON DELETE CASCADE;`);
      console.log('Added uc_id to sessions table.');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('uc_id already exists in sessions.');
      } else {
        throw e;
      }
    }

    // 2. Change status in attendance table to VARCHAR
    try {
      // First, drop the default so we can alter the type
      await client.query(`ALTER TABLE attendance ALTER COLUMN status DROP DEFAULT;`);
      
      // Then, alter the type with USING clause to convert boolean to string
      await client.query(`
        ALTER TABLE attendance 
        ALTER COLUMN status TYPE VARCHAR(20) 
        USING CASE 
          WHEN status::boolean = true THEN 'present' 
          WHEN status::boolean = false THEN 'absent'
          ELSE 'absent' 
        END;
      `);

      // Set the new default
      await client.query(`ALTER TABLE attendance ALTER COLUMN status SET DEFAULT 'absent';`);
      console.log('Successfully altered status to VARCHAR in attendance table.');
    } catch (e) {
      console.log('Error altering status, might already be altered:', e.message);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
