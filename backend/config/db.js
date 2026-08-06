const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL must be configured');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must be configured. The backend API requires the service role key to bypass RLS.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;


