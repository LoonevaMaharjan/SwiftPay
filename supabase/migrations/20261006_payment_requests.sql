create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public.users(id) on delete cascade,
  payer_user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(20, 6) not null check (amount > 0),
  token text not null default 'USDC' check (token = 'USDC'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'declined')),
  transaction_signature text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint payment_requests_distinct_users check (requester_user_id <> payer_user_id)
);

create index if not exists payment_requests_payer_created_idx
  on public.payment_requests (payer_user_id, created_at desc);

create index if not exists payment_requests_requester_created_idx
  on public.payment_requests (requester_user_id, created_at desc);

alter table public.payment_requests enable row level security;
