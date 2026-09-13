alter table public.organizations
  add column if not exists slug text;

update public.organizations
set slug = coalesce(
  nullif(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), ''),
  'organization'
) || '-' || substr(id::text, 1, 8)
where slug is null;

alter table public.organizations
  alter column slug set not null;

create unique index if not exists organizations_slug_key
  on public.organizations (slug);