drop table if exists public.notifications cascade;

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  exchange_id uuid references public.exchanges(id) on delete cascade,
  title text not null,
  detail text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for querying unread notifications for a user
create index if not exists notifications_profile_id_read_idx on public.notifications(profile_id, read);

-- Enable RLS
alter table public.notifications enable row level security;

-- Trigger function on Exchanges to auto-create notifications
create or replace function public.on_exchange_change()
returns trigger as $$
declare
  sender_name text;
  receiver_name text;
begin
  select full_name into sender_name from public.profiles where id = NEW.sender_id;
  select full_name into receiver_name from public.profiles where id = NEW.receiver_id;

  if (TG_OP = 'INSERT') then
    insert into public.notifications (profile_id, exchange_id, title, detail)
    values (
      NEW.receiver_id,
      NEW.id,
      'New Exchange Request',
      coalesce(sender_name, 'Someone') || ' sent you an exchange request.'
    );
  elsif (TG_OP = 'UPDATE') then
    if (OLD.status <> NEW.status) then
      if (NEW.status = 'matched') then
        insert into public.notifications (profile_id, exchange_id, title, detail)
        values (
          NEW.sender_id,
          NEW.id,
          'Exchange Request Accepted',
          coalesce(receiver_name, 'Your partner') || ' accepted your exchange request.'
        );
      elsif (NEW.status = 'receiver_declined') then
        insert into public.notifications (profile_id, exchange_id, title, detail)
        values (
          NEW.sender_id,
          NEW.id,
          'Exchange Request Declined',
          coalesce(receiver_name, 'Your partner') || ' declined your exchange request.'
        );
      elsif (NEW.status = 'sender_cancelled') then
        insert into public.notifications (profile_id, exchange_id, title, detail)
        values (
          NEW.receiver_id,
          NEW.id,
          'Exchange Request Cancelled',
          coalesce(sender_name, 'Your partner') || ' cancelled the exchange request.'
        );
      elsif (NEW.status = 'completed') then
        insert into public.notifications (profile_id, exchange_id, title, detail)
        values (
          NEW.sender_id,
          NEW.id,
          'Exchange Completed',
          'Your skill exchange with ' || coalesce(receiver_name, 'your partner') || ' is marked as completed.'
        );
        insert into public.notifications (profile_id, exchange_id, title, detail)
        values (
          NEW.receiver_id,
          NEW.id,
          'Exchange Completed',
          'Your skill exchange with ' || coalesce(sender_name, 'your partner') || ' is marked as completed.'
        );
      end if;
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger on exchanges
create trigger on_exchange_change_trigger
  after insert or update on public.exchanges
  for each row
  execute function public.on_exchange_change();
