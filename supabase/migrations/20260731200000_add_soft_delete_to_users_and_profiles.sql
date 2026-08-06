alter table public.users add column if not exists deleted_at timestamptz;
alter table public.profiles add column if not exists deleted_at timestamptz;
