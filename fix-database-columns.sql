-- Fix database column mismatches
-- Run this in your Supabase SQL Editor

-- Fix appointments table - change user_id to patient_id
alter table public.appointments rename column user_id to patient_id;

-- Fix reports table - change user_id to patient_id  
alter table public.reports rename column user_id to patient_id;

-- Fix health_metrics table - change user_id to patient_id
alter table public.health_metrics rename column user_id to patient_id;

-- Update policies to use patient_id instead of user_id
drop policy if exists "Users can view their own appointments" on public.appointments;
drop policy if exists "Users can create their own appointments" on public.appointments;
drop policy if exists "Users can update their own appointments" on public.appointments;
drop policy if exists "Users can delete their own appointments" on public.appointments;

create policy "Users can view their own appointments"
    on public.appointments
    for select
    using (auth.uid() = patient_id);

create policy "Users can create their own appointments"
    on public.appointments
    for insert
    with check (auth.uid() = patient_id);

create policy "Users can update their own appointments"
    on public.appointments
    for update
    using (auth.uid() = patient_id);

create policy "Users can delete their own appointments"
    on public.appointments
    for delete
    using (auth.uid() = patient_id);

-- Update reports policies
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

-- Update health_metrics policies
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

-- Update indexes
drop index if exists appointments_user_id_idx;
create index appointments_patient_id_idx on public.appointments(patient_id);

drop index if exists reports_user_id_idx;
create index reports_patient_id_idx on public.reports(patient_id);

drop index if exists health_metrics_user_id_idx;
create index health_metrics_patient_id_idx on public.health_metrics(patient_id);
