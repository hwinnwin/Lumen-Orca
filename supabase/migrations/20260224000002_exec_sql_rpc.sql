-- Allows the build-app Edge Function to execute generated migration SQL.
-- SECURITY DEFINER: runs as the function owner (superuser), not the caller.
-- Gated to service_role only — never callable by anon or authenticated users.
-- Allowlist approach: only CREATE TABLE IF NOT EXISTS, CREATE INDEX, ALTER TABLE ADD COLUMN.

create or replace function public.exec_sql(query text)
returns void
language plpgsql
security definer
as $$
declare
  stmt text;
  stmts text[];
begin
  -- Hard gate: only service_role can call this
  if current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND auth.role() <> 'service_role' then
    raise exception 'exec_sql: not allowed for role %', coalesce(auth.role(), 'unknown');
  end if;

  -- Allowlist: validate each statement individually.
  -- Split on semicolons and check every non-empty statement.
  stmts := string_to_array(query, ';');
  foreach stmt in array stmts loop
    stmt := btrim(stmt);
    -- Skip empty statements (trailing semicolons)
    continue when stmt = '';
    -- Only allow CREATE TABLE IF NOT EXISTS, CREATE INDEX, ALTER TABLE ADD COLUMN
    if stmt !~* '^\s*(CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS|CREATE\s+(UNIQUE\s+)?INDEX|ALTER\s+TABLE\s+\S+\s+ADD\s+(COLUMN\s+)?)' then
      raise exception 'exec_sql: only CREATE TABLE IF NOT EXISTS, CREATE INDEX, and ALTER TABLE ADD COLUMN are permitted. Got: %', left(stmt, 80);
    end if;
  end loop;

  execute query;
end;
$$;

-- Lock down permissions
revoke all on function public.exec_sql(text) from public;
revoke all on function public.exec_sql(text) from anon;
revoke all on function public.exec_sql(text) from authenticated;
grant execute on function public.exec_sql(text) to service_role;
