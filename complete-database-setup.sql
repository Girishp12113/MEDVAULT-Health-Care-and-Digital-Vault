-- Complete Database Setup for MedVault
-- Run this in your Supabase SQL Editor

-- Create patients table
drop table if exists public.patients cascade;
create table public.patients (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null unique,
    name text not null,
    date_of_birth date,
    condition text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Create doctors table
drop table if exists public.doctors cascade;
create table public.doctors (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null unique,
    name text not null,
    specialty text,
    license_number text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Create reports table
drop table if exists public.reports cascade;
create table public.reports (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references auth.users(id) on delete cascade not null,
    report_type text not null,
    report_name text not null,
    file_url text,
    analysis_result text,
    uploaded_at timestamp with time zone default now() not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Create health_metrics table
drop table if exists public.health_metrics cascade;
create table public.health_metrics (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references auth.users(id) on delete cascade not null,
    metric_type text not null, -- e.g., 'blood_pressure', 'weight', 'glucose'
    metric_value text not null,
    unit text, -- e.g., 'mmHg', 'kg', 'mg/dL'
    recorded_at timestamp with time zone default now() not null,
    notes text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Create access_requests table
drop table if exists public.access_requests cascade;
create table public.access_requests (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references auth.users(id) on delete cascade not null,
    doctor_id uuid references auth.users(id) on delete cascade not null,
    doctor_name text not null,
    request_type text not null check (request_type in ('profile', 'reports', 'all')),
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security for all tables
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.reports enable row level security;
alter table public.health_metrics enable row level security;
alter table public.access_requests enable row level security;

-- Patients table policies
drop policy if exists "Patients can view their own record" on public.patients;
drop policy if exists "Doctors can view patient records" on public.patients;
drop policy if exists "Users can insert their own patient record" on public.patients;

create policy "Patients can view their own record" on public.patients
    for select using (auth.uid() = user_id);

create policy "Doctors can view patient records" on public.patients
    for select using (
        exists (
            select 1 from public.access_requests 
            where access_requests.patient_id = patients.user_id 
            and access_requests.doctor_id = auth.uid() 
            and access_requests.status = 'approved'
        )
    );

create policy "Users can insert their own patient record" on public.patients
    for insert with check (auth.uid() = user_id);

-- Doctors table policies
drop policy if exists "Doctors can view their own record" on public.doctors;
drop policy if exists "Anyone can view doctor information" on public.doctors;
drop policy if exists "Users can insert their own doctor record" on public.doctors;

create policy "Doctors can view their own record" on public.doctors
    for select using (auth.uid() = user_id);

create policy "Anyone can view doctor information" on public.doctors
    for select using (true);

create policy "Users can insert their own doctor record" on public.doctors
    for insert with check (auth.uid() = user_id);

-- Reports table policies
drop policy if exists "Patients can view their own reports" on public.reports;
drop policy if exists "Doctors can view approved patient reports" on public.reports;
drop policy if exists "Patients can upload their own reports" on public.reports;

create policy "Patients can view their own reports" on public.reports
    for select using (auth.uid() = patient_id);

create policy "Doctors can view approved patient reports" on public.reports
    for select using (
        exists (
            select 1 from public.access_requests 
            where access_requests.patient_id = reports.patient_id 
            and access_requests.doctor_id = auth.uid() 
            and access_requests.status = 'approved' 
            and access_requests.request_type in ('reports', 'all')
        )
    );

create policy "Patients can upload their own reports" on public.reports
    for insert with check (auth.uid() = patient_id);

-- Health metrics table policies
drop policy if exists "Patients can view their own health metrics" on public.health_metrics;
drop policy if exists "Doctors can view approved patient health metrics" on public.health_metrics;
drop policy if exists "Patients can add their own health metrics" on public.health_metrics;

create policy "Patients can view their own health metrics" on public.health_metrics
    for select using (auth.uid() = patient_id);

create policy "Doctors can view approved patient health metrics" on public.health_metrics
    for select using (
        exists (
            select 1 from public.access_requests 
            where access_requests.patient_id = health_metrics.patient_id 
            and access_requests.doctor_id = auth.uid() 
            and access_requests.status = 'approved'
        )
    );

create policy "Patients can add their own health metrics" on public.health_metrics
    for insert with check (auth.uid() = patient_id);

-- Access requests table policies
drop policy if exists "Patients can view their own access requests" on public.access_requests;
drop policy if exists "Doctors can view their own access requests" on public.access_requests;
drop policy if exists "Doctors can create access requests" on public.access_requests;
drop policy if exists "Patients can update access requests" on public.access_requests;

create policy "Patients can view their own access requests" on public.access_requests
    for select using (auth.uid() = patient_id);

create policy "Doctors can view their own access requests" on public.access_requests
    for select using (auth.uid() = doctor_id);

create policy "Doctors can create access requests" on public.access_requests
    for insert with check (auth.uid() = doctor_id);

create policy "Patients can update access requests" on public.access_requests
    for update using (auth.uid() = patient_id);

-- Create indexes for better performance
create index if not exists patients_user_id_idx on public.patients(user_id);
create index if not exists doctors_user_id_idx on public.doctors(user_id);
create index if not exists reports_patient_id_idx on public.reports(patient_id);
create index if not exists health_metrics_patient_id_idx on public.health_metrics(patient_id);
create index if not exists access_requests_patient_id_idx on public.access_requests(patient_id);
create index if not exists access_requests_doctor_id_idx on public.access_requests(doctor_id);
create index if not exists access_requests_status_idx on public.access_requests(status);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to authenticated;
grant all privileges on all sequences in schema public to authenticated;

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_patients_updated_at before update on public.patients
    for each row execute procedure public.handle_updated_at();

create trigger handle_doctors_updated_at before update on public.doctors
    for each row execute procedure public.handle_updated_at();

create trigger handle_reports_updated_at before update on public.reports
    for each row execute procedure public.handle_updated_at();

create trigger handle_health_metrics_updated_at before update on public.health_metrics
    for each row execute procedure public.handle_updated_at();

create trigger handle_access_requests_updated_at before update on public.access_requests
    for each row execute procedure public.handle_updated_at();
