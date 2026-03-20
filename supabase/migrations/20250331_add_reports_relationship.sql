-- Create reports table if it doesn't exist
create table if not exists reports (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references auth.users not null,
  title text not null,
  content text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table reports enable row level security;

-- Create policies for reports table
create policy "Patients can view their own reports"
  on reports
  for select
  using (auth.uid() = patient_id);

create policy "Doctors can view reports with approved access"
  on reports
  for select
  using (
    exists (
      select 1 from access_requests ar
      where ar.patient_id = reports.patient_id
      and ar.doctor_id = auth.uid()
      and ar.status = 'approved'
    )
  );

-- Add foreign key relationship between patients and reports
alter table reports
  add constraint fk_patient
  foreign key (patient_id)
  references patients(user_id)
  on delete cascade;
