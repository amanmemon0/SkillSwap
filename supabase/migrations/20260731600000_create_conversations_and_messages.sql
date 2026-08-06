drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;

-- Conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_canonical_order check (user1_id < user2_id),
  unique (user1_id, user2_id)
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- Indexes for fast query
create index if not exists messages_conversation_id_created_at_idx on public.messages(conversation_id, created_at);
create index if not exists conversations_user1_id_idx on public.conversations(user1_id);
create index if not exists conversations_user2_id_idx on public.conversations(user2_id);

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
