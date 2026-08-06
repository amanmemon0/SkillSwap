-- Create debug table and inspect policy settings
create table if not exists public.rls_debug_log (
  id serial primary key,
  tablename text,
  relrowsecurity boolean,
  relforcerowsecurity boolean,
  policy_name text,
  roles text[],
  cmd text,
  qual text
);

-- Clean it up
truncate public.rls_debug_log;

-- Insert pg_class details for profiles and users
insert into public.rls_debug_log (tablename, relrowsecurity, relforcerowsecurity)
select 
  c.relname, 
  c.relrowsecurity, 
  c.relforcerowsecurity 
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles', 'users');

-- Insert pg_policies details
insert into public.rls_debug_log (tablename, policy_name, roles, cmd, qual)
select 
  schemaname || '.' || tablename, 
  policyname, 
  roles, 
  cmd, 
  qual 
from pg_policies 
where schemaname = 'public' and tablename in ('profiles', 'users');
