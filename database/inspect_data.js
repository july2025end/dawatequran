const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function checkAllData() {
  const client = new Client({ connectionString });
  await client.connect();

  const query = `
    SELECT 
      z.name as zone_name,
      sec.name as sector_name,
      uc.name as uc_name,
      qc.name as circle_name,
      prof.full_name as profile_head_name,
      prof.phone as profile_head_phone,
      p.full_name as member_name,
      p.phone as member_phone,
      p.type as member_type,
      p.remarks as member_remarks
    FROM quran_circles qc
    JOIN union_councils uc ON qc.uc_id = uc.id
    JOIN sectors sec ON uc.sector_id = sec.id
    JOIN zones z ON sec.zone_id = z.id
    LEFT JOIN public.profiles prof ON prof.assigned_circle_id = qc.id
    LEFT JOIN participants p ON p.circle_id = qc.id
    ORDER BY z.name, sec.name, uc.name, qc.name, p.full_name;
  `;

  const res = await client.query(query);
  console.log('Total DB participant/circle rows:', res.rows.length);

  // Group by UC -> Circle
  const ucs = {};
  for (const r of res.rows) {
    if (!ucs[r.uc_name]) ucs[r.uc_name] = {};
    if (!ucs[r.uc_name][r.circle_name]) {
      ucs[r.uc_name][r.circle_name] = {
        sector: r.sector_name,
        zone: r.zone_name,
        head: r.profile_head_name || null,
        members: []
      };
    }
    if (r.member_name) {
      ucs[r.uc_name][r.circle_name].members.push({
        name: r.member_name,
        phone: r.member_phone,
        type: r.member_type,
        remarks: r.member_remarks
      });
    }
  }

  console.log('\n--- DB UC SUMMARY ---');
  for (const [uc, circles] of Object.entries(ucs)) {
    console.log(`UC: ${uc}`);
    for (const [cName, cData] of Object.entries(circles)) {
      console.log(`   ${cName} | Head: ${cData.head} | Members count: ${cData.members.length}`);
    }
  }

  // Also check roster.json
  const rosterPath = path.join(__dirname, 'seed_data/roster.json');
  if (fs.existsSync(rosterPath)) {
    const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
    console.log('\n--- ROSTER JSON SUMMARY ---');
    for (const z of roster.zones) {
      for (const s of z.sectors) {
        for (const uc of s.union_councils) {
          console.log(`Roster UC: ${uc.name}`);
          for (const c of uc.quran_circles) {
            console.log(`   ${c.name} | Murabbi/Head: ${c.murabbi} | Participants: ${c.participants ? c.participants.join(', ') : 'None'}`);
          }
        }
      }
    }
  }

  await client.end();
}

checkAllData().catch(console.error);
