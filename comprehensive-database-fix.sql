-- Comprehensive database fix for all column mismatches
-- Run this in your Supabase SQL Editor

-- Fix health_metrics table (add missing columns, fix user_id references)
ALTER TABLE public.health_metrics ADD COLUMN IF NOT EXISTS bloodSugar text;
ALTER TABLE public.health_metrics ADD COLUMN IF NOT EXISTS blood_pressure text;
ALTER TABLE public.health_metrics ADD COLUMN IF NOT EXISTS heart_rate integer;
ALTER TABLE public.health_metrics ADD COLUMN IF NOT EXISTS weight numeric;
ALTER TABLE public.health_metrics ADD COLUMN IF NOT EXISTS height numeric;

-- Fix reports table (add missing columns, fix user_id references)
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS date timestamp with time zone;

-- Fix appointments table (add missing status column)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled';

-- Update any remaining user_id columns to patient_id in tables that should have them
DO $$
BEGIN
    -- Check if health_metrics still has user_id instead of patient_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_metrics' AND column_name = 'user_id') THEN
        ALTER TABLE health_metrics RENAME COLUMN user_id TO patient_id;
    END IF;
    
    -- Check if reports still has user_id instead of patient_id  
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'user_id') THEN
        ALTER TABLE reports RENAME COLUMN user_id TO patient_id;
    END IF;
END $$;

-- Update indexes for renamed columns
DROP INDEX IF EXISTS health_metrics_user_id_idx;
CREATE INDEX IF NOT EXISTS health_metrics_patient_id_idx ON public.health_metrics(patient_id);

DROP INDEX IF EXISTS reports_user_id_idx;
CREATE INDEX IF NOT EXISTS reports_patient_id_idx ON public.reports(patient_id);

-- Update RLS policies for renamed columns
DROP POLICY IF EXISTS "Patients can view their own health metrics" ON public.health_metrics;
CREATE POLICY "Patients can view their own health metrics" ON public.health_metrics
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can add their own health metrics" ON public.health_metrics;
CREATE POLICY "Patients can add their own health metrics" ON public.health_metrics
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can view their own reports" ON public.reports;
CREATE POLICY "Patients can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can upload their own reports" ON public.reports;
CREATE POLICY "Patients can upload their own reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = patient_id);
