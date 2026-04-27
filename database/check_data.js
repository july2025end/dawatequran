const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function checkData() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    const res = await client.query(`
      SELECT 
        p.full_name,
        qc.name as circle_name,
        uc.name as uc_name
      FROM participants p
      LEFT JOIN quran_circles qc ON p.circle_id = qc.id
      LEFT JOIN union_councils uc ON qc.uc_id = uc.id
      LIMIT 5;
    `);
    
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
checkData();