-- Fix only the appointments table - rename user_id to patient_id
alter table public.appointments rename column user_id to patient_id;

-- Update the appointments policies to use patient_id
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

-- Update the appointments index
drop index if exists appointments_user_id_idx;
create index appointments_patient_id_idx on public.appointments(patient_id);
