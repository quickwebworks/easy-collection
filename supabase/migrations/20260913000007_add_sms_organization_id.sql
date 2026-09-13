alter table public.sms_messages
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;