create or replace function public.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
      and organization_id = target_organization_id
      and role = 'CLIENT'
      and is_active = true
  ) or public.is_super_admin();
$$;

drop policy if exists "Organization admins manage memberships" on public.organization_members;
create policy "Organization admins manage memberships"
  on public.organization_members for all
  using (public.is_organization_admin(organization_id))
  with check (public.is_organization_admin(organization_id));