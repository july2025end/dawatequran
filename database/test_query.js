const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const { data, error } = await supabase
      .from("participants")
      .select(`
        *,
        quran_circles (
          id,
          name,
          union_councils (
            id,
            name
          )
        )
      `)
      .limit(1);
      
    console.log("Error:", error);
    console.log("Data:", JSON.stringify(data, null, 2));
}

testQuery();