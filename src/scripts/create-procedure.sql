-- Create function to execute arbitrary SQL
create or replace function create_table(table_sql text)
returns void as $$
begin
  execute table_sql;
end;
$$ language plpgsql security definer;
