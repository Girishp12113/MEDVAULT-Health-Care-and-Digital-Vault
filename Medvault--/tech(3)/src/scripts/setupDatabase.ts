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

async function setupDatabase() {
  try {
    console.log('Setting up appointments table...');

    // Create the table using Supabase's SQL query
    const { error: createError } = await supabase.from('appointments').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy insert to create table
      doctor_name: 'Test',
      specialty: 'Test',
      date: new Date().toISOString(),
      time: '12:00',
      notes: 'Test',
      reminder_sent: false
    });

    if (createError) {
      if (createError.code === '42P01') {
        console.log('Table does not exist, creating it...');
        const { error: createTableError } = await supabase.rpc('create_appointments_table');
        
        if (createTableError) {
          console.error('Error creating table:', createTableError);
          return;
        }
        
        console.log('Table created successfully!');
      } else {
        console.error('Error:', createError);
        return;
      }
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
setupDatabase();
