create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('sms', 'whatsapp')),
  phone text not null,
  message text not null,
  provider_message_id text,
  status text not null default 'SENT',
  created_at timestamptz not null default now()
);

alter table public.sms_messages enable row level security;

drop policy if exists "Backend can manage SMS messages" on public.sms_messages;
create policy "Backend can manage SMS messages"
  on public.sms_messages for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and is_active = true
        and platform_role in ('SUPER_ADMIN', 'BACKEND')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and is_active = true
        and platform_role in ('SUPER_ADMIN', 'BACKEND')
    )
  );