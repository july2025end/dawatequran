import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Replace with your actual Supabase URL and Service Role Key
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Syllabus
    const syllabusPath = path.join(__dirname, '../../database/seed_data/syllabus.json');
    if (fs.existsSync(syllabusPath)) {
      const syllabusData = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
      console.log(`Loading ${syllabusData.length} syllabus topics...`);
      const { error } = await supabase.from('syllabus_topics').upsert(syllabusData, { onConflict: 'topic_number' });
      if (error) throw error;
      console.log('✅ Syllabus seeded.');
    }

    // 2. Seed Geography & Structure
    const rosterPath = path.join(__dirname, '../../database/seed_data/roster.json');
    if (fs.existsSync(rosterPath)) {
      const rosterData = JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
      
      for (const zone of rosterData.zones) {
        // Insert Zone
        const { data: zoneData, error: zoneError } = await supabase
          .from('zones')
          .insert({ name: zone.name })
          .select()
          .single();
        if (zoneError) throw zoneError;

        for (const sector of zone.sectors) {
          // Insert Sector
          const { data: sectorData, error: sectorError } = await supabase
            .from('sectors')
            .insert({ name: sector.name, zone_id: zoneData.id })
            .select()
            .single();
          if (sectorError) throw sectorError;

          for (const uc of sector.union_councils) {
            // Insert UC
            const { data: ucData, error: ucError } = await supabase
              .from('union_councils')
              .insert({ name: uc.name, sector_id: sectorData.id })
              .select()
              .single();
            if (ucError) throw ucError;

            for (const circle of uc.quran_circles) {
              // Insert Circle
              const { data: circleData, error: circleError } = await supabase
                .from('quran_circles')
                .insert({ name: circle.name, uc_id: ucData.id })
                .select()
                .single();
              if (circleError) throw circleError;

              // 1. Handle Murabbi (Profile + Phone)
              if (circle.murabbi && circle.murabbi !== 'Pending') {
                // In a real scenario, we'd use supabase.auth.admin.createUser()
                // Here we simulate the profile record
                console.log(`Setting up Murabbi: ${circle.murabbi} for ${circle.name}`);
              }

              // 2. Insert Participants
              if (circle.participants && circle.participants.length > 0) {
                const participantRecords = circle.participants.map(name => ({
                  full_name: name,
                  type: 'haazir_arkan', // Defaulting to Arkan based on data description
                  circle_id: circleData.id,
                  is_active: true
                }));

                const { error: partError } = await supabase
                  .from('participants')
                  .insert(participantRecords);
                
                if (partError) {
                  console.error(`Error inserting participants for ${circle.name}:`, partError);
                } else {
                  console.log(`Inserted ${participantRecords.length} participants for ${circle.name}`);
                }
              }

              console.log(`✅ Created Circle: ${circle.name} (UC: ${uc.name})`);
            }
          }
        }
      }
      console.log('✅ Structure & Roster seeded.');
    }

    // 3. Seed Detailed (Compiled) Roster if exists
    const compiledPath = path.join(__dirname, '../../database/seed_data/compiled_roster.json');
    if (fs.existsSync(compiledPath)) {
        const compiledData = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
        console.log(`Processing ${compiledData.length} detailed participants...`);
        
        for (const item of compiledData) {
            // Find UC
            const { data: ucData } = await supabase
                .from('union_councils')
                .select('id')
                .ilike('name', `%${item.uc}%`)
                .single();
            
            if (ucData) {
                // Find or create a default circle for this UC if not specified
                // For simplicity, we assign to the first circle of that UC
                const { data: circleData } = await supabase
                    .from('quran_circles')
                    .select('id')
                    .eq('uc_id', ucData.id)
                    .limit(1)
                    .single();
                
                if (circleData) {
                    await supabase.from('participants').insert({
                        full_name: item.name,
                        phone: item.phone,
                        remarks: item.remarks,
                        circle_id: circleData.id,
                        type: 'haazir_arkan',
                        is_active: true
                    });
                }
            }
        }
        console.log('✅ Compiled roster details seeded.');
    }

    console.log('🎉 Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
}

seed();
