-- Review and apply in Supabase only after confirming this migration.
-- Existing public.payments rows are preserved.
alter table public.payments
  add column if not exists idempotency_key uuid,
  add column if not exists network text not null default 'devnet',
  add column if not exists failure_code text,
  add column if not exists submitted_at timestamptz,
  add column if not exists confirmed_at timestamptz;

create unique index if not exists payments_sender_idempotency_key_idx
  on public.payments (sender_user_id, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists payments_transaction_signature_idx
  on public.payments (transaction_signature)
  where transaction_signature is not null;

alter table public.payments
  add constraint payments_status_check
  check (status in ('created', 'submitted', 'processing', 'confirmed', 'failed')) not valid,
  add constraint payments_privacy_status_check
  check (privacy_status in ('public', 'private')) not valid;

-- Validate constraints only after any legacy rows are normalized.
-- alter table public.payments validate constraint payments_status_check;
-- alter table public.payments validate constraint payments_privacy_status_check;
