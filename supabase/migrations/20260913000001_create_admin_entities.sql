create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  contact_email text, phone text, city text, is_active boolean not null default true, created_at timestamptz not null default now()
);
alter table public.organizations add column if not exists phone text;
alter table public.organizations add column if not exists city text;
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(), name text not null, description text,
  price numeric(12,2) not null default 0, billing_period text not null default 'MONTHLY' check (billing_period in ('MONTHLY','YEARLY')),
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.loan_types (
  id uuid primary key default gen_random_uuid(), name text not null, description text,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete restrict, status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','CANCELLED','EXPIRED')),
  starts_at date, ends_at date, created_at timestamptz not null default now()
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  amount numeric(12,2) not null default 0, status text not null default 'PENDING' check (status in ('PENDING','PAID','FAILED','REFUNDED')),
  reference text, paid_at date, created_at timestamptz not null default now()
);

create or replace function public.is_super_admin() returns boolean
language sql security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and platform_role = 'SUPER_ADMIN' and is_active = true) $$;

do $$ declare entity text; begin
  foreach entity in array array['organizations','packages','loan_types','subscriptions','payments'] loop
    execute format('alter table public.%I enable row level security', entity);
    execute format('drop policy if exists "Super admins manage %1$s" on public.%1$s', entity);
    execute format('create policy "Super admins manage %1$s" on public.%1$s for all using (public.is_super_admin()) with check (public.is_super_admin())', entity);
  end loop;
end $$;

drop policy if exists "Super admins manage profiles" on public.profiles;
create policy "Super admins manage profiles" on public.profiles for all using (public.is_super_admin()) with check (public.is_super_admin());