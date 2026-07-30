create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

do $$
declare
  foreign_key_name text;
begin
  for foreign_key_name in
    select constraint_definition.conname
    from pg_constraint constraint_definition
    join pg_class source_table on source_table.oid = constraint_definition.conrelid
    join pg_namespace source_schema on source_schema.oid = source_table.relnamespace
    join pg_class referenced_table on referenced_table.oid = constraint_definition.confrelid
    join pg_namespace referenced_schema on referenced_schema.oid = referenced_table.relnamespace
    where constraint_definition.contype = 'f'
      and source_schema.nspname = 'public'
      and source_table.relname = 'profiles'
      and referenced_schema.nspname = 'auth'
      and referenced_table.relname = 'users'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', foreign_key_name);
  end loop;

  if not exists (
    select 1
    from pg_constraint constraint_definition
    join pg_class source_table on source_table.oid = constraint_definition.conrelid
    join pg_namespace source_schema on source_schema.oid = source_table.relnamespace
    join pg_class referenced_table on referenced_table.oid = constraint_definition.confrelid
    join pg_namespace referenced_schema on referenced_schema.oid = referenced_table.relnamespace
    where constraint_definition.contype = 'f'
      and source_schema.nspname = 'public'
      and source_table.relname = 'profiles'
      and referenced_schema.nspname = 'public'
      and referenced_table.relname = 'users'
      and constraint_definition.conkey = array[
        (
          select attribute.attnum
          from pg_attribute attribute
          where attribute.attrelid = source_table.oid
            and attribute.attname = 'id'
            and not attribute.attisdropped
        )
      ]::smallint[]
  ) then
    alter table public.profiles
      add constraint profiles_id_users_fkey
      foreign key (id) references public.users(id) on delete cascade;
  end if;
end;
$$;
