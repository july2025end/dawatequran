const { Client } = require('pg');
const connectionString = 'postgresql://postgres:dawatequran@db.qksaxqetzgqflhqhctrd.supabase.co:5432/postgres';

const pdfData = [
  {
    uc: "UC-81",
    circles: [
      { name: "Circle 1", murabbi: "Professor Abdul Sami", participants: ["Jawad Saleem", "Muhammad Saleem Chaudhry", "Auf Abdul Rehman", "Abdul Rab"] },
      { name: "Circle 2", murabbi: "Hafiz Mubarak Ahmed", participants: ["Mubashir", "Adnan Sami"] },
      { name: "Circle 3", murabbi: "Dr. Zaheer-ud-Din Bahram", participants: ["Muhammad Rashid", "Umar Shah", "Bilal Rukhsar Abbasi", "Zia-ur-Rehman"] },
      { name: "Circle 4", murabbi: "Malik Noman", participants: ["Muhammad Anwar Khawaja", "Muhammad Akhtar Abbas", "Naeem Abbasi", "Rao Ashfaq", "Bashir"] }
    ]
  },
  {
    uc: "UC-82",
    circles: [
      { name: "Circle 1", murabbi: "Mubarak Ahmed", participants: ["Shafqat Saleem", "Arshad"] },
      { name: "Circle 2", murabbi: "Abdul Samad", participants: ["Raja Tanveer", "Ibrahim Samad", "Taha", "Moiz", "Sarwar Hasan", "Syed Zubair", "Tajammul Hussain", "Mohsin", "Atif"] }
    ]
  },
  {
    uc: "UC-83",
    circles: [
      { name: "Circle 1", murabbi: "Dr. Mubeen Siddiqui", participants: ["Azhar Baloch", "Rashid Hussain", "Raja Muhammad Mansoor", "Syed Hussain Shah", "Chaudhry Muhammad Iqbal", "Shahid Imran Gondal", "Mahboob Hashmi", "Waqar Jadoon"] }
    ]
  },
  {
    uc: "UC-84",
    circles: [
      { name: "Circle 1", murabbi: "Maaz Siddiqui", participants: ["Local Residents"] },
      { name: "Circle 2", murabbi: "Mushtaq Najmi", participants: ["Aman bin Mushtaq", "Badr-ul-Islam", "Waqar Ahmed", "Dilawar Shah", "Qari Abdullah", "Asjad Murtaza", "Hafiz Ali"] },
      { name: "Circle 3", murabbi: "Ghulam Sarwar Shakir", participants: ["Chaudhry Muhammad Siddique", "Muhammad Yusuf Ghazi", "Muzammil Sarwar Shakir"] },
      { name: "Circle 4", murabbi: "Ghulam Mustafa", participants: ["Muhammad Tariq", "Jameel Baloch", "Umar Farooq", "Fayyaz Ahmed", "Muhammad Waseem Sheikh", "Shah Gul"] }
    ]
  },
  {
    uc: "UC-85",
    circles: [
      { name: "Circle 1", murabbi: "Dr. Tahir Farooq", participants: ["Syed Saif-ul-Islam", "Malik Inam", "Youth Group", "Atta-ur-Rehman", "Mukhtar Bhatti"] },
      { name: "Circle 2", murabbi: "Abdullah Sarfraz", participants: ["Ibrahim Alvi", "Abdul Samad", "Jahanzeb Bhatti", "Muhammad Aslam", "Umair Hasan"] },
      { name: "Circle 3", murabbi: "Abdul Quddus Qureshi", participants: ["Farman Allah", "Aurangzeb Baig", "Umair"] }
    ]
  },
  {
    uc: "UC-86",
    circles: [
      { name: "Circle 1", murabbi: "Abdul Haseeb", participants: ["Adnan Shah", "Muhammad Arslan", "Dr. Abdul Jabbar", "Malik Abdul Rehman", "Muneeb ur Rehman"] },
      { name: "Circle 2", murabbi: "Hafiz Bakht Ali", participants: ["Imdad Ali", "Fateh Muhammad", "Khalid Hayat", "Dr. Noor Hayat"] },
      { name: "Circle 3", murabbi: "Sagheer Bhatti", participants: ["Tajammul Nadir", "Abdul Mannan", "Saeed Ahmed"] },
      { name: "Circle 4", murabbi: "Farid Brohi", participants: ["Shabbir Ahmed", "Chaudhry Younas"] },
      { name: "Circle 5", murabbi: "Mushtaq Ahmed", participants: ["Zia ur Rehman", "Fawad Ahmed"] }
    ]
  },
  {
    uc: "UC-87",
    circles: [
      { name: "Circle 1", murabbi: "Niaz Malik", participants: ["Zafarullah Chaudhry", "Daler Khan", "Dr. Abdul Khaliq", "Abdul Ghaffar Nadeem", "Syed Mehmood Ahmed"] },
      { name: "Circle 2", murabbi: "Tayyab Siddiqui", participants: ["Shabbir Hussain", "Abdul Waheed", "Rizwan Khan", "Syed Saeed-ur-Rehman", "Rizwan Baig", "Zaheer Ahmed", "Muneeb Chughtai"] }
    ]
  },
  {
    uc: "UC-88",
    circles: [
      { name: "Circle 1", murabbi: "Zubair Ahmed Siddiqui", participants: ["Asad Ali Mughal", "Shams-ul-Islam", "Shams-ul-Haq", "Mushtaq-ur-Rehman", "Qazi Israil", "Farooq Khan", "Najeeb ur Rehman Abbasi", "Muhammad Younas Shakir"] },
      { name: "Circle 2", murabbi: "Saeed Ahmed", participants: ["Altaf Sher", "Imran Bukhari", "Aamir Nadeem Janjua", "Saqib Riaz", "Ahmed Ali Janjua", "Taha Saeed"] }
    ]
  },
  {
    uc: "UC-89",
    circles: [
      { name: "Circle 1", murabbi: "Haroon Abbasi", participants: ["Sikandar Hayat", "Saadan Yusuf", "Israr Ahmed", "Shakeel Ahmed"] },
      { name: "Circle 2", murabbi: "Qayyum Johar", participants: ["Muhammad Sibtain", "No Zaman", "M. Arif Bhatti", "Rana Ijaz"] },
      { name: "Circle 3", murabbi: "Dr. Hussain Majid", participants: ["Zafar-ul-Islam Chaudhry", "Anjum Raheel", "Javed Akhtar Chaudhry"] }
    ]
  },
  { uc: "UC-90-A", circles: [{ name: "Circle 1", murabbi: "Pending", participants: [] }, { name: "Circle 2", murabbi: "Pending", participants: [] }] },
  { uc: "UC-90-B", circles: [{ name: "Circle 1", murabbi: "Pending", participants: [] }, { name: "Circle 2", murabbi: "Pending", participants: [] }, { name: "Circle 3", murabbi: "Pending", participants: [] }] },
  { uc: "UC-91", circles: [{ name: "Circle 1", murabbi: "Pending", participants: [] }, { name: "Circle 2", murabbi: "Pending", participants: [] }, { name: "Circle 3", murabbi: "Pending", participants: [] }, { name: "Circle 4", murabbi: "Pending", participants: [] }, { name: "Circle 5", murabbi: "Pending", participants: [] }] },
  { uc: "UC-92", circles: [{ name: "Circle 1", murabbi: "Pending", participants: [] }, { name: "Circle 2", murabbi: "Pending", participants: [] }, { name: "Circle 3", murabbi: "Pending", participants: [] }, { name: "Circle 4", murabbi: "Pending", participants: [] }, { name: "Circle 5", murabbi: "Pending", participants: [] }] },
  { uc: "UC-93", circles: [{ name: "Circle 1", murabbi: "Pending", participants: [] }, { name: "Circle 2", murabbi: "Pending", participants: [] }, { name: "Circle 3", murabbi: "Pending", participants: [] }, { name: "Circle 4", murabbi: "Pending", participants: [] }, { name: "Circle 5", murabbi: "Pending", participants: [] }] }
];

async function syncData() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('📡 Connected for detailed sync.');

    await client.query(`ALTER TABLE quran_circles ADD COLUMN IF NOT EXISTS murabbi_name VARCHAR(255);`);

    for (const ucItem of pdfData) {
      const ucRes = await client.query('SELECT id FROM union_councils WHERE name ILIKE $1 LIMIT 1', [`%${ucItem.uc}%`]);
      if (ucRes.rows.length === 0) {
        console.log(`❌ Could not find UC: ${ucItem.uc}`);
        continue;
      }
      const ucId = ucRes.rows[0].id;

      for (const circleItem of ucItem.circles) {
        let circleId;
        const circRes = await client.query('SELECT id FROM quran_circles WHERE uc_id = $1 AND name = $2', [ucId, circleItem.name]);
        
        if (circRes.rows.length > 0) {
          circleId = circRes.rows[0].id;
          await client.query('UPDATE quran_circles SET murabbi_name = $1 WHERE id = $2', [circleItem.murabbi, circleId]);
        } else {
          const insertRes = await client.query('INSERT INTO quran_circles (name, uc_id, murabbi_name) VALUES ($1, $2, $3) RETURNING id', [circleItem.name, ucId, circleItem.murabbi]);
          circleId = insertRes.rows[0].id;
        }

        for (const pName of circleItem.participants) {
          const partRes = await client.query('SELECT id FROM participants WHERE full_name ILIKE $1', [pName]);
          if (partRes.rows.length > 0) {
            await client.query('UPDATE participants SET circle_id = $1 WHERE id = $2', [circleId, partRes.rows[0].id]);
          } else {
            await client.query('INSERT INTO participants (full_name, circle_id, type) VALUES ($1, $2, $3)', [pName, circleId, 'haazir_arkan']);
          }
        }
        console.log(`✅ Synced ${ucItem.uc} - ${circleItem.name}`);
      }
    }
    console.log('🎉 Detailed sync completed!');
  } catch (err) {
    console.error('❌ Sync failed:', err);
  } finally {
    await client.end();
  }
}
syncData();
