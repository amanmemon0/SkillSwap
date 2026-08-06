-- Reusable updated_at trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop table if exists public.exchanges cascade;

-- Exchanges table
create table if not exists public.exchanges (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  sender_skill_id uuid references public.skills(id) on delete set null,
  receiver_skill_id uuid references public.skills(id) on delete set null,
  sender_skill_name text not null,
  receiver_skill_name text not null,
  status text not null default 'pending' check (status in ('pending', 'matched', 'completed', 'sender_cancelled', 'receiver_declined')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exchanges_sender_receiver_different check (sender_id <> receiver_id)
);

-- Trigger for updated_at
create trigger set_exchanges_updated_at
  before update on public.exchanges
  for each row
  execute function public.set_updated_at();

-- Indexes for performance
create index if not exists exchanges_sender_id_idx on public.exchanges(sender_id);
create index if not exists exchanges_receiver_id_idx on public.exchanges(receiver_id);
create index if not exists exchanges_status_idx on public.exchanges(status);

-- Enable RLS
alter table public.exchanges enable row level security;
