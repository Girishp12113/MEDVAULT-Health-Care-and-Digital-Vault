-- Drop existing table if it exists
drop table if exists public.appointments cascade;

-- Create appointments table
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

-- Drop existing policies if they exist
drop policy if exists "Users can view their own appointments" on public.appointments;
drop policy if exists "Users can create their own appointments" on public.appointments;
drop policy if exists "Users can update their own appointments" on public.appointments;
drop policy if exists "Users can delete their own appointments" on public.appointments;

-- Create policy to allow users to see only their own appointments
create policy "Users can view their own appointments"
    on public.appointments
    for select
    using (auth.uid() = user_id);

-- Create policy to allow users to insert their own appointments
create policy "Users can create their own appointments"
    on public.appointments
    for insert
    with check (auth.uid() = user_id);

-- Create policy to allow users to update their own appointments
create policy "Users can update their own appointments"
    on public.appointments
    for update
    using (auth.uid() = user_id);

-- Create policy to allow users to delete their own appointments
create policy "Users can delete their own appointments"
    on public.appointments
    for delete
    using (auth.uid() = user_id);

-- Create indexes
drop index if exists appointments_user_id_idx;
drop index if exists appointments_date_idx;
create index appointments_user_id_idx on public.appointments(user_id);
create index appointments_date_idx on public.appointments(date);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all privileges on table public.appointments to authenticated;
