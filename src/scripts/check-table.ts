import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    console.log('Checking appointments table...');

    // Try to get table information
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error checking table:', error);
      if (error.code === '42P01') {
        console.error('Table does not exist!');
      } else {
        console.error('Other error:', error.message);
      }
      return;
    }

    console.log('Table exists and is accessible');
    
    // Check RLS policies
    const { data: rls, error: rlsError } = await supabase
      .rpc('check_rls_policies', { table_name: 'appointments' });

    if (rlsError) {
      console.error('Error checking RLS policies:', rlsError);
    } else {
      console.log('RLS policies:', rls);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkTable();
