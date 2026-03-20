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
    console.log('Creating appointments table...');

    // Create the table directly
    const { error: createError } = await supabase.rpc('create_table', {
      table_sql: `
        create table if not exists public.appointments (
          id uuid default gen_random_uuid() primary key,
          user_id uuid references auth.users(id) not null,
          doctor_name text not null,
          specialty text not null,
          date date not null,
          time time not null,
          notes text,
          reminder_sent boolean default false,
          created_at timestamp with time zone default now() not null
        );

        -- Set up Row Level Security (RLS)
        alter table public.appointments enable row level security;

        -- Create policies
        create policy "Users can view their own appointments"
          on public.appointments
          for select
          using (auth.uid() = user_id);

        create policy "Users can create their own appointments"
          on public.appointments
          for insert
          with check (auth.uid() = user_id);

        create policy "Users can update their own appointments"
          on public.appointments
          for update
          using (auth.uid() = user_id);

        create policy "Users can delete their own appointments"
          on public.appointments
          for delete
          using (auth.uid() = user_id);

        -- Create indexes
        create index if not exists appointments_user_id_idx on public.appointments(user_id);
        create index if not exists appointments_date_idx on public.appointments(date);

        -- Grant permissions
        grant usage on schema public to anon, authenticated;
        grant all privileges on table public.appointments to authenticated;
      `
    });

    if (createError) {
      console.error('Error creating table:', createError);
      return;
    }

    console.log('Table created successfully!');

    // Verify the table exists
    const { data, error: checkError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('Error verifying table:', checkError);
      return;
    }

    console.log('Table verified successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the setup
setupDatabase();
