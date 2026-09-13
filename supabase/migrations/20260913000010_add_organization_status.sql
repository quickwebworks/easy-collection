alter table public.organizations
  add column if not exists status text not null default 'ACTIVE';

update public.organizations
set status = 'BLOCKED'
where is_active = false
  and status = 'ACTIVE';

alter table public.organizations
  drop constraint if exists organizations_status_check;

alter table public.organizations
  add constraint organizations_status_check
  check (status in ('ACTIVE', 'BLOCKED', 'SUSPENDED', 'CANCELLED'));