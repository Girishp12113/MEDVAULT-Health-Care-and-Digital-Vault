-- Create appointments table
create table if not exists public.appointments (
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

-- Create index for faster queries
create index if not exists appointments_user_id_idx on public.appointments(user_id);
create index if not exists appointments_date_idx on public.appointments(date);
