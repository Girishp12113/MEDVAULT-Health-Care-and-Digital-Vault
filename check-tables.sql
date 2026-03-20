-- Check current table structure
-- Run this to see what columns actually exist

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('appointments', 'reports', 'health_metrics')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
