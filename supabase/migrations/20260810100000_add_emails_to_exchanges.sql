alter table public.exchanges
  add column if not exists sender_email text,
  add column if not exists receiver_email text;
