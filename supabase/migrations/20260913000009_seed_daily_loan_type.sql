insert into public.loan_types (name, description, is_active)
select 'Daily Collection Loan', 'Loan product with scheduled daily collection installments.', true
where not exists (
  select 1 from public.loan_types where name = 'Daily Collection Loan'
);