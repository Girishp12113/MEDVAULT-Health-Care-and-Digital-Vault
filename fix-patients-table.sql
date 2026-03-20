-- Create proper patients table structure
-- Run this in your Supabase SQL Editor

-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS public.patients CASCADE;

-- Create patients table with correct structure
CREATE TABLE public.patients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    date_of_birth date,
    gender text,
    blood_group text,
    phone text,
    address text,
    emergency_contact jsonb DEFAULT '{}',
    medical_conditions text,
    allergies text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policies for patients table
DROP POLICY IF EXISTS "Patients can view their own profile" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own profile" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own profile" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view patient profiles with approved access" ON public.patients;

CREATE POLICY "Patients can view their own profile" ON public.patients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can update their own profile" ON public.patients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert their own profile" ON public.patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient profiles with approved access" ON public.patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.access_requests 
            WHERE access_requests.patient_id = patients.user_id 
            AND access_requests.doctor_id = auth.uid() 
            AND access_requests.status = 'approved'
        )
    );

-- Create indexes
CREATE INDEX patients_user_id_idx ON public.patients(user_id);
CREATE INDEX patients_name_idx ON public.patients(name);

-- Create trigger for updated_at
CREATE TRIGGER handle_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
