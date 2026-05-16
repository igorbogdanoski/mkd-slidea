-- ============================================================================
-- Manual checkout orders (PayPal / IBAN / трансакциска сметка)
-- Се користи додека Stripe интеграцијата не е активна.
-- ============================================================================

create table if not exists public.manual_orders (
  id              uuid primary key default gen_random_uuid(),
  order_id        text unique not null,
  user_id         uuid references auth.users(id) on delete set null,
  plan            text not null check (plan in ('monthly','quarterly','semester','yearly')),
  amount          numeric(10,2) not null,
  currency        text not null default 'EUR',
  method          text not null check (method in ('paypal','bank_eur','bank_mkd')),
  email           text not null,
  full_name       text,
  org_name        text,
  tax_id          text,
  needs_invoice   boolean default false,
  note            text,
  plan_days       integer not null default 31,
  status          text not null default 'pending' check (status in ('pending','confirmed','rejected','refunded','expired')),
  paid_at         timestamptz,
  confirmed_at    timestamptz,
  confirmed_by    uuid references auth.users(id),
  rejection_reason text,
  ip              text,
  user_agent      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_manual_orders_status on public.manual_orders(status);
create index if not exists idx_manual_orders_email on public.manual_orders(email);
create index if not exists idx_manual_orders_user on public.manual_orders(user_id);
create index if not exists idx_manual_orders_created on public.manual_orders(created_at desc);

-- Auto-update updated_at
create or replace function public.touch_manual_orders_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_manual_orders_updated_at on public.manual_orders;
create trigger trg_manual_orders_updated_at
  before update on public.manual_orders
  for each row execute function public.touch_manual_orders_updated_at();

-- RLS
alter table public.manual_orders enable row level security;

drop policy if exists "users see own orders" on public.manual_orders;
create policy "users see own orders"
  on public.manual_orders for select
  using (auth.uid() = user_id or email = auth.email());

drop policy if exists "admins see all orders" on public.manual_orders;
create policy "admins see all orders"
  on public.manual_orders for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists "anyone can create order" on public.manual_orders;
create policy "anyone can create order"
  on public.manual_orders for insert
  with check (true);

-- ============================================================================
-- RPC: confirm_manual_order — admin confirm, sets profile plan + pro_until
-- ============================================================================
create or replace function public.confirm_manual_order(p_order_id text)
returns void language plpgsql security definer as $$
declare
  v_order public.manual_orders%rowtype;
  v_until timestamptz;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only admins can confirm orders';
  end if;

  select * into v_order from public.manual_orders
    where order_id = p_order_id and status = 'pending'
    for update;

  if not found then
    raise exception 'Order not found or not pending: %', p_order_id;
  end if;

  v_until := now() + (v_order.plan_days || ' days')::interval;

  update public.manual_orders set
    status = 'confirmed',
    confirmed_at = now(),
    confirmed_by = auth.uid(),
    paid_at = coalesce(paid_at, now())
  where order_id = p_order_id;

  if v_order.user_id is not null then
    update public.profiles set
      plan = v_order.plan,
      pro_until = greatest(coalesce(pro_until, now()), v_until)
    where id = v_order.user_id;
  end if;
end $$;

create or replace function public.reject_manual_order(p_order_id text, p_reason text)
returns void language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only admins can reject orders';
  end if;

  update public.manual_orders set
    status = 'rejected',
    rejection_reason = p_reason,
    confirmed_at = now(),
    confirmed_by = auth.uid()
  where order_id = p_order_id and status = 'pending';
end $$;

grant execute on function public.confirm_manual_order(text) to authenticated;
grant execute on function public.reject_manual_order(text, text) to authenticated;
