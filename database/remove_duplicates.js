const { Client } = require('pg');
// Run with: node --env-file=database/.env database/remove_duplicates.js  (copy database/.env.example to database/.env)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set. See database/.env.example.');

async function removeDuplicates() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Delete duplicates keeping the one with the lowest ID (or oldest created_at)
    // Using ctid is a common way in postgres, or max(id)
    const res = await client.query(`
      DELETE FROM participants
      WHERE id IN (
        SELECT id
        FROM (
          SELECT id,
          ROW_NUMBER() OVER (partition BY full_name, phone, circle_id ORDER BY id) as rnum
          FROM participants
        ) t
        WHERE t.rnum > 1
      );
    `);
    
    console.log(`✅ Deleted ${res.rowCount} duplicate participants.`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
removeDuplicates();