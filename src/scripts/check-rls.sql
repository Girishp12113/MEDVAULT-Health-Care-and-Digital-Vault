-- Function to check RLS policies
create or replace function check_rls_policies(table_name text)
returns jsonb as $$
declare
    result jsonb;
begin
    select jsonb_build_object(
        'table_exists', (
            select true 
            from pg_tables 
            where schemaname = 'public' 
            and tablename = table_name
        ),
        'rls_enabled', (
            select relrowsecurity 
            from pg_class 
            where relname = table_name
        ),
        'policies', (
            select jsonb_agg(jsonb_build_object(
                'policy_name', polname,
                'command', polcmd,
                'roles', polroles,
                'using_expr', pg_get_expr(polqual, polrelid),
                'with_check_expr', pg_get_expr(polwithcheck, polrelid)
            ))
            from pg_policy
            where polrelid = (table_name::regclass)
        )
    ) into result;
    
    return result;
end;
$$ language plpgsql;
