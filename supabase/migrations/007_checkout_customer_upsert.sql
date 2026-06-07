-- Checkout customer upsert without exposing customer rows to anon SELECT/UPDATE.
-- Used by music purchase and booking flows from the public site.

create or replace function public.upsert_checkout_customer(
  p_full_name text,
  p_cell_number text,
  p_email text,
  p_type text default 'buyer'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
  v_existing_type text;
  v_merged_type text;
begin
  if p_type not in ('buyer', 'booker') then
    raise exception 'invalid customer type';
  end if;

  if v_email = '' or trim(p_full_name) = '' or trim(p_cell_number) = '' then
    raise exception 'customer details are required';
  end if;

  select id, type into v_id, v_existing_type
  from customers
  where lower(email) = v_email;

  if v_id is not null then
    v_merged_type := case
      when v_existing_type = 'both' then 'both'
      when v_existing_type = 'booker' and p_type = 'buyer' then 'both'
      when v_existing_type = 'buyer' and p_type = 'booker' then 'both'
      else coalesce(v_existing_type, p_type)
    end;

    update customers
    set
      full_name = trim(p_full_name),
      cell_number = trim(p_cell_number),
      type = v_merged_type
    where id = v_id;

    return v_id;
  end if;

  insert into customers (full_name, cell_number, email, type)
  values (trim(p_full_name), trim(p_cell_number), v_email, p_type)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_checkout_customer(text, text, text, text) from public;
grant execute on function public.upsert_checkout_customer(text, text, text, text) to anon, authenticated;

-- Ensure insert policy remains for direct inserts (legacy paths).
drop policy if exists "Public insert customers" on customers;
create policy "Public insert customers"
  on customers
  for insert
  to anon, authenticated
  with check (true);
