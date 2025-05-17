-- Function to execute SQL
create or replace function exec_sql(sql_string text)
returns void as $$
begin
  execute sql_string;
end;
$$ language plpgsql security definer;

-- Function to drop table if exists
create or replace function drop_table_if_exists(table_name text)
returns void as $$
begin
  execute format('drop table if exists %I cascade', table_name);
end;
$$ language plpgsql security definer;

-- Function to create appointments table and set up permissions
create or replace function create_appointments_table()
returns void as $$
begin
    -- Create appointments table
    create table public.appointments (
        id uuid default gen_random_uuid() primary key,
        user_id uuid references auth.users(id) on delete cascade not null,
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
    grant all privileges on table public.appointments to authenticated;
    grant usage on schema public to anon, authenticated;
end;
$$ language plpgsql security definer;
