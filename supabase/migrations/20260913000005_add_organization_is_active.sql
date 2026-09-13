alter table public.organizations
  add column if not exists is_active boolean not null default true;