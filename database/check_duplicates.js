const { Client } = require('pg');
// Run with: node --env-file=database/.env database/check_duplicates.js  (copy database/.env.example to database/.env)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set. See database/.env.example.');

async function checkDuplicates() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Find duplicate participants by name and phone
    const res = await client.query(`
      SELECT full_name, phone, circle_id, count(*), array_agg(id) as ids
      FROM participants
      GROUP BY full_name, phone, circle_id
      HAVING count(*) > 1;
    `);
    
    console.log(`Found ${res.rows.length} groups of duplicates.`);
    if (res.rows.length > 0) {
        console.log(JSON.stringify(res.rows, null, 2));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
checkDuplicates();