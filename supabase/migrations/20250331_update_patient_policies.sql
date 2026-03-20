-- Drop existing policies
drop policy if exists "Patients can view their own data" on patients;

-- Create new policies for patients table
create policy "Patients can view their own data"
  on patients
  for select
  using (auth.uid() = user_id);

create policy "Doctors can view patient data with approved access"
  on patients
  for select
  using (
    exists (
      select 1 from access_requests ar
      where ar.patient_id = patients.user_id
      and ar.doctor_id = auth.uid()
      and ar.status = 'approved'
    )
  );

-- Update policies for reports table
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

-- Update policies for health_metrics table if it exists
create policy if not exists "Doctors can view health metrics with approved access"
  on health_metrics
  for select
  using (
    exists (
      select 1 from access_requests ar
      where ar.patient_id = health_metrics.patient_id
      and ar.doctor_id = auth.uid()
      and ar.status = 'approved'
    )
  );
