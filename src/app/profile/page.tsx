'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Check, Copy, ExternalLink, Fingerprint, Mail, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type UserProfile = {
  username: string;
  email: string | null;
  wallet_address: string;
};

function shortAddress(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-6)}`;
}

export default function ProfilePage() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'username' | 'wallet' | null>(null);

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Couldn’t load your profile.');
      setProfile(data.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Couldn’t load your profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready && authenticated) void loadProfile();
  }, [ready, authenticated]);

  async function copy(value: string, target: 'username' | 'wallet') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError('Clipboard access is unavailable in this browser.');
    }
  }

  if (!ready || loading) return <div className="mx-auto max-w-3xl space-y-5"><div className="h-8 w-40 animate-pulse rounded bg-muted" /><div className="h-64 animate-pulse rounded-3xl bg-muted" /><div className="h-48 animate-pulse rounded-3xl bg-muted" /></div>;
  if (error && !profile) return <Card className="mx-auto mt-10 max-w-xl rounded-3xl"><CardContent className="space-y-4 py-8"><p className="font-medium">We couldn’t load your profile</p><p className="text-sm text-muted-foreground">{error}</p><Button variant="outline" onClick={() => void loadProfile()}>Try again</Button></CardContent></Card>;
  if (!profile) return null;

  const initial = profile.username.charAt(0).toUpperCase();
  const paymentUrl = `/pay/${encodeURIComponent(profile.username)}`;

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <div className="mb-7">
        <p className="text-sm font-medium text-primary">@{profile.username}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your SwiftPay identity and payment details.</p>
      </div>

      {error && <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="status">{error}</p>}

      <Card className="mb-5 overflow-hidden rounded-3xl border-0 bg-primary text-primary-foreground shadow-lg shadow-primary/15">
        <CardContent className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div aria-hidden="true" className="absolute -right-12 -top-24 size-64 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-2 -top-16 size-44 rounded-full border border-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/12 text-2xl font-semibold ring-1 ring-white/15">{initial}</div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold tracking-tight">@{profile.username}</h2><span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[11px] font-medium"><ShieldCheck className="size-3.5" aria-hidden="true" /> Active</span></div><p className="mt-1 text-sm text-primary-foreground/75">SwiftPay member</p></div>
          </div>
          <Button type="button" variant="secondary" className="relative min-h-11 w-full rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:w-auto" onClick={() => window.open(paymentUrl, '_blank', 'noopener,noreferrer')}><ExternalLink className="size-4" aria-hidden="true" /> View payment page</Button>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="pb-3"><div className="mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-5" aria-hidden="true" /></div><CardTitle className="text-lg">Personal details</CardTitle><CardDescription>How people find you on SwiftPay.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <ProfileRow icon={<Fingerprint className="size-4" aria-hidden="true" />} label="Username" value={`@${profile.username}`} action={<Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" onClick={() => void copy(profile.username, 'username')} aria-label={copied === 'username' ? 'Username copied' : 'Copy username'}>{copied === 'username' ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}</Button>} />
            <ProfileRow icon={<Mail className="size-4" aria-hidden="true" />} label="Email" value={profile.email ?? 'No email added'} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="pb-3"><div className="mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet className="size-5" aria-hidden="true" /></div><CardTitle className="text-lg">Solana wallet</CardTitle><CardDescription>Your wallet receives SwiftPay payments.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <ProfileRow icon={<Wallet className="size-4" aria-hidden="true" />} label="Wallet address" value={shortAddress(profile.wallet_address)} title={profile.wallet_address} mono action={<Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" onClick={() => void copy(profile.wallet_address, 'wallet')} aria-label={copied === 'wallet' ? 'Wallet address copied' : 'Copy wallet address'}>{copied === 'wallet' ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}</Button>} />
            <p className="rounded-xl bg-muted/60 px-3 py-2.5 text-xs leading-5 text-muted-foreground">Keep your wallet secure. SwiftPay will never ask you to share your recovery phrase.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 rounded-3xl border-primary/15 bg-primary/5 shadow-none">
        <CardContent className="flex items-start gap-3 p-5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-sm"><ShieldCheck className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold">Privacy is built in</p><p className="mt-1 text-xs leading-5 text-muted-foreground">SwiftPay uses private transfers by default. You don’t need to switch on a separate privacy setting.</p></div></CardContent>
      </Card>
    </div>
  );
}

function ProfileRow({ icon, label, value, title, mono = false, action }: { icon: React.ReactNode; label: string; value: string; title?: string; mono?: boolean; action?: React.ReactNode }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-background p-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted/70 text-muted-foreground">{icon}</span><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-0.5 truncate text-sm font-medium ${mono ? 'font-mono' : ''}`} title={title ?? value}>{value}</p></div>{action}</div>;
}
