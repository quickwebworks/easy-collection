alter table public.organizations
  add column if not exists legal_name text,
  add column if not exists address text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists pincode text;