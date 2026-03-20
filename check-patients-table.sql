-- Check current patients table structure and data
-- Run this in your Supabase SQL Editor

-- Check if patients table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'patients'
);

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any patients in the table
SELECT COUNT(*) as patient_count FROM public.patients;

-- Show all patient records (if any)
SELECT * FROM public.patients LIMIT 5;
