alter table public.packages
  add column if not exists validity_days integer,
  add column if not exists discount_percentage numeric(5,2) not null default 0;

insert into public.packages (name, description, price, billing_period, validity_days, discount_percentage)
select '1 Year Plan', 'Collection platform access for one year.', 9999, 'YEARLY', 365, 0
where not exists (
  select 1 from public.packages where name = '1 Year Plan'
);

insert into public.packages (name, description, price, billing_period, validity_days, discount_percentage)
select '3 Year Plan', 'Collection platform access for three years with 20% discount.', 23997, 'YEARLY', 1095, 20
where not exists (
  select 1 from public.packages where name = '3 Year Plan'
);