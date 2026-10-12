# SwiftPay

SwiftPay is a Solana payment app for sending and receiving USDC, with private payments powered by Helius Privacy. The current configuration targets **Solana Devnet** and is intended for development and evaluation.

## Features

- Sign in with Google and use an embedded Solana wallet through Privy.
- Set up a SwiftPay username and send or request USDC.
- Deposit USDC into a Helius Privacy wallet and make private transfers.
- View balances, payment history, payment requests, and payment links.
- Persist profiles and payment records in Supabase.

The public landing page currently routes its sign-in and start-sending actions to a Coming Soon page. The authenticated dashboard and API routes are present for development.

## Requirements

- Node.js 24 or later
- npm
- A Privy app with Google login enabled
- A Supabase project
- Helius Privacy Devnet access and an API key

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the credentials for your own Privy, Supabase, and Helius projects.

3. Apply the SQL migrations in `supabase/migrations/` to your Supabase project, in filename order.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID used by the browser sign-in provider. |
| `PRIVY_APP_SECRET` | Privy server-side app secret. Keep private. |
| `PRIVY_JWT_VERIFICATION_KEY` | Public key used to verify Privy JWTs on the server. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key for client access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key used by server routes. Keep private. |
| `NEXT_PUBLIC_HELIUS_API_KEY` | Helius Devnet key used by the browser privacy SDK. |
| `HELIUS_API_KEY` | Optional server-side Helius key; takes precedence over the public key on the server. |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | Optional browser RPC URL override. |
| `HELIUS_RPC_URL` | Optional server RPC URL override. |
| `NEXT_PUBLIC_HELIUS_INDEXER_URL` | Optional browser Helius Privacy indexer override. |
| `HELIUS_INDEXER_URL` | Optional server indexer override. |
| `NEXT_PUBLIC_HELIUS_PROVER_URL` | Optional browser Helius Privacy prover override. |
| `HELIUS_PROVER_URL` | Optional server prover override. |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC URL for public token and SOL balance reads. Defaults to Solana Devnet if omitted. |

Variables prefixed with `NEXT_PUBLIC_` are included in the client bundle. Never put private keys, service-role keys, or other server secrets in those variables. Use `.env.local` for local credentials and never commit it.

## Supabase migrations

The migrations add the payment, request, and private-request processing schema:

1. `20260919_secure_payments.sql`
2. `20261006_payment_requests.sql`
3. `20261007_private_request_processing.sql`

Run these against the Supabase project configured in `.env.local` before using payment-related API routes.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve the production build. |

## Network and token

The app is configured for Solana Devnet. The USDC mint used by the app is `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (Devnet). Do not treat Devnet tokens as real funds.

## Project structure

```text
src/app/          App Router pages and API routes
src/components/   UI components
src/hooks/        Wallet and balance hooks
src/lib/          Solana, Supabase, authentication, and server helpers
src/providers/    Wallet and privacy providers
supabase/         Database migrations
scripts/          Local setup scripts
```
