-- Create health_metrics table
create table health_metrics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  time text not null,
  heartRate integer,
  systolic integer,
  diastolic integer,
  bloodSugar integer,
  temperature decimal(3,1),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable row level security
alter table health_metrics enable row level security;

-- Create policies
create policy "Users can view their own health metrics" on health_metrics
  for select using (auth.uid() = user_id);

create policy "Users can insert their own health metrics" on health_metrics
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own health metrics" on health_metrics
  for update using (auth.uid() = user_id);

create policy "Users can delete their own health metrics" on health_metrics
  for delete using (auth.uid() = user_id);
