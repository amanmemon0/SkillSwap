-- Explicitly enable Row Level Security on all tables to ensure strict privacy controls
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.member_skills enable row level security;
alter table public.exchanges enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
