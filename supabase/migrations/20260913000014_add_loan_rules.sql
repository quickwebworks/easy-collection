alter table public.loan_types
  add column if not exists interest_type text not null default 'FLAT',
  add column if not exists interest_rate numeric(7,2) not null default 0,
  add column if not exists tenure_days integer not null default 30,
  add column if not exists collection_frequency text not null default 'DAILY',
  add column if not exists min_amount numeric(12,2) not null default 0,
  add column if not exists max_amount numeric(12,2);

alter table public.loan_types
  drop constraint if exists loan_types_interest_type_check,
  drop constraint if exists loan_types_collection_frequency_check,
  drop constraint if exists loan_types_interest_rate_check,
  drop constraint if exists loan_types_tenure_days_check,
  drop constraint if exists loan_types_amount_range_check;

alter table public.loan_types
  add constraint loan_types_interest_type_check check (interest_type in ('FLAT', 'PERCENTAGE')),
  add constraint loan_types_collection_frequency_check check (collection_frequency in ('DAILY', 'WEEKLY', 'MONTHLY')),
  add constraint loan_types_interest_rate_check check (interest_rate >= 0),
  add constraint loan_types_tenure_days_check check (tenure_days > 0),
  add constraint loan_types_amount_range_check check (max_amount is null or max_amount >= min_amount);

update public.loan_types
set tenure_days = 365, collection_frequency = 'DAILY'
where name = 'Daily Collection Loan';