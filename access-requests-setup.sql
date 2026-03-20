-- Drop existing table if it exists
drop table if exists public.access_requests cascade;

-- Create access_requests table
create table if not exists public.access_requests (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references auth.users(id) on delete cascade not null,
    doctor_id uuid references auth.users(id) on delete cascade not null,
    doctor_name text not null,
    request_type text not null check (request_type in ('profile', 'reports', 'all')),
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Set up Row Level Security (RLS)
alter table public.access_requests enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Patients can view their own access requests" on public.access_requests;
drop policy if exists "Doctors can view their own access requests" on public.access_requests;
drop policy if exists "Patients can update access requests" on public.access_requests;
drop policy if exists "Doctors can create access requests" on public.access_requests;

-- Create policy to allow patients to see access requests for their records
create policy "Patients can view their own access requests"
    on public.access_requests
    for select
    using (auth.uid() = patient_id);

-- Create policy to allow doctors to see access requests they created
create policy "Doctors can view their own access requests"
    on public.access_requests
    for select
    using (auth.uid() = doctor_id);

-- Create policy to allow doctors to create access requests
create policy "Doctors can create access requests"
    on public.access_requests
    for insert
    with check (auth.uid() = doctor_id);

-- Create policy to allow patients to update access requests (approve/reject)
create policy "Patients can update access requests"
    on public.access_requests
    for update
    using (auth.uid() = patient_id);

-- Create indexes
drop index if exists access_requests_patient_id_idx;
drop index if exists access_requests_doctor_id_idx;
drop index if exists access_requests_status_idx;
create index access_requests_patient_id_idx on public.access_requests(patient_id);
create index access_requests_doctor_id_idx on public.access_requests(doctor_id);
create index access_requests_status_idx on public.access_requests(status);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all privileges on table public.access_requests to authenticated;

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_access_requests_updated_at
  before update on public.access_requests
  for each row
  execute procedure public.handle_updated_at();
