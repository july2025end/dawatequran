const { Client } = require('pg');
// Run with: node --env-file=database/.env database/alter_phone.js  (copy database/.env.example to database/.env)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set. See database/.env.example.');

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