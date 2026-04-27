const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function alter() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query('ALTER TABLE participants ALTER COLUMN phone TYPE VARCHAR(255);');
    await client.query('ALTER TABLE public.profiles ALTER COLUMN phone TYPE VARCHAR(255);');
    console.log('✅ Altered phone columns.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
alter();