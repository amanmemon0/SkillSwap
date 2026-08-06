const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectDebugLog() {
  console.log('Fetching RLS debug log...');

  const { data: logs, error } = await supabase
    .from('rls_debug_log')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching rls_debug_log:', error.message);
  } else {
    console.log('--- RLS Debug Logs ---');
    console.table(logs);
  }
}

inspectDebugLog();
