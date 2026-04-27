const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

async function migrateAndSeed() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('📡 Connected to Supabase Postgres.');

    // 1. Run Schema
    console.log('📜 Running schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    
    try {
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                    CREATE TYPE user_role AS ENUM ('murabbi', 'moawin_dawat', 'zone_nazim', 'admin');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_type') THEN
                    CREATE TYPE participant_type AS ENUM ('haazir_arkan', 'aam_afraad');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_category') THEN
                    CREATE TYPE event_category AS ENUM ('quran_circle', 'ijtima_arkan', 'dars_e_quran', 'other');
                END IF;
            END $$;
        `);
        
        // Ensure phone columns are long enough if tables exist
        await client.query('ALTER TABLE IF EXISTS participants ALTER COLUMN phone TYPE VARCHAR(255);');
        await client.query('ALTER TABLE IF EXISTS public.profiles ALTER COLUMN phone TYPE VARCHAR(255);');
        
        // Remove the CREATE TYPE lines from schemaSql to avoid re-executing them
        const cleanedSchema = schemaSql
            .replace(/CREATE TYPE user_role AS ENUM \(.*?\);/g, '')
            .replace(/CREATE TYPE participant_type AS ENUM \(.*?\);/g, '')
            .replace(/CREATE TYPE event_category AS ENUM \(.*?\);/g, '');
        
        await client.query(cleanedSchema);
        console.log('✅ Schema applied.');
    } catch (err) {
        console.warn('⚠️ Note: Some schema elements might already exist. Continuing...');
    }

    // 2. Seed Syllabus
    console.log('🌱 Seeding syllabus...');
    const syllabusPath = path.join(__dirname, '../database/seed_data/syllabus.json');
    if (fs.existsSync(syllabusPath)) {
      const syllabusData = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
      for (const topic of syllabusData) {
        await client.query(
          'INSERT INTO syllabus_topics (topic_number, title, reference) VALUES ($1, $2, $3) ON CONFLICT (topic_number) DO UPDATE SET title = EXCLUDED.title, reference = EXCLUDED.reference',
          [topic.topic_number, topic.title, topic.reference]
        );
      }
      console.log(`✅ Seeded ${syllabusData.length} topics.`);
    }

    // 3. Seed Geography & Structure
    console.log('🗺️ Seeding structure and circles...');
    const rosterPath = path.join(__dirname, '../database/seed_data/roster.json');
    if (fs.existsSync(rosterPath)) {
      const rosterData = JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
      
      for (const zone of rosterData.zones) {
        const zoneRes = await client.query('INSERT INTO zones (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id', [zone.name]);
        const zoneId = zoneRes.rows[0]?.id || (await client.query('SELECT id FROM zones WHERE name = $1', [zone.name])).rows[0].id;

        for (const sector of zone.sectors) {
          const sectorRes = await client.query('INSERT INTO sectors (name, zone_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id', [sector.name, zoneId]);
          const sectorId = sectorRes.rows[0]?.id || (await client.query('SELECT id FROM sectors WHERE name = $1', [sector.name])).rows[0].id;

          for (const uc of sector.union_councils) {
            const ucRes = await client.query('INSERT INTO union_councils (name, sector_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id', [uc.name, sectorId]);
            const ucId = ucRes.rows[0]?.id || (await client.query('SELECT id FROM union_councils WHERE name = $1', [uc.name])).rows[0].id;

            for (const circle of uc.quran_circles) {
              await client.query('INSERT INTO quran_circles (name, uc_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [circle.name, ucId]);
            }
          }
        }
      }
      console.log('✅ Structure & Circles seeded.');
    }

    // 4. Seed Detailed Participants (Compiled Roster)
    console.log('👥 Seeding compiled participant data...');
    const compiledPath = path.join(__dirname, '../database/seed_data/compiled_roster.json');
    if (fs.existsSync(compiledPath)) {
        const compiledData = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
        let count = 0;
        for (const item of compiledData) {
            // Match UC name (loosely)
            const ucRes = await client.query('SELECT id FROM union_councils WHERE name ILIKE $1 LIMIT 1', [`%${item.uc}%`]);
            if (ucRes.rows.length > 0) {
                const ucId = ucRes.rows[0].id;
                // Get first circle for this UC
                const circleRes = await client.query('SELECT id FROM quran_circles WHERE uc_id = $1 LIMIT 1', [ucId]);
                if (circleRes.rows.length > 0) {
                    await client.query(
                        'INSERT INTO participants (full_name, phone, remarks, circle_id, type, is_active) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
                        [item.name, item.phone, item.remarks, circleRes.rows[0].id, 'haazir_arkan', true]
                    );
                    count++;
                }
            }
        }
        console.log(`✅ Seeded ${count} participants from compiled list.`);
    }

    console.log('🎉 Seeding completed successfully!');

  } catch (err) {
    console.error('❌ Migration/Seeding failed:', err);
  } finally {
    await client.end();
  }
}

migrateAndSeed();
