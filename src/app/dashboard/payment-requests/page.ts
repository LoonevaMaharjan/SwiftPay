'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, HandCoins, RefreshCw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type IncomingRequest = {
  id: string;
  amount: string;
  token: string;
  status: string;
  created_at: string;
  requester: { username: string } | null;
};

type OutgoingRequest = {
  id: string;
  amount: string;
  token: string;
  status: string;
  created_at: string;
  payer: { username: string } | null;
};

export default function PaymentRequestsPage() {
  const { ready, getAccessToken } = usePrivy();
  const router = useRouter();

  const [incoming, setIncoming] = useState<IncomingRequest[] | null>(null);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[] | null>(null);
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [decliningId, setDecliningId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/payment-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load requests.');
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) void load();
  }, [ready]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username, amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create the request.');
      setUsername('');
      setAmount('');
      void load();
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : 'Could not create the request.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDecline(id: string) {
    setDecliningId(id);
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/payment-requests/${id}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not decline the request.');
      void load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not decline the request.');
    } finally {
      setDecliningId(null);
    }
  }

  function handleApprove(req: IncomingRequest) {
    const recipient = req.requester?.username ?? '';
    router.push(`/dashboard/send?recipient=${encodeURIComponent(recipient)}&amount=${encodeURIComponent(req.amount)}`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Payment requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ask someone for USDC, or review requests sent to you.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          <p>{error}</p>
          <Button className="mt-3" variant="outline" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      )}

      <Card className="mb-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HandCoins className="size-5 text-primary" aria-hidden="true" />
            <CardTitle>Request USDC</CardTitle>
          </div>
          <CardDescription>Ask another SwiftPay user to send you USDC.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              required
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (USDC)"
              className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              required
            />
            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <Button type="submit" disabled={creating} className="w-full">
              {creating ? 'Sending request...' : 'Send request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2 rounded-lg bg-muted p-1 text-sm">
          <button
            onClick={() => setTab('incoming')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${tab === 'incoming' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            Incoming
          </button>
          <button
            onClick={() => setTab('outgoing')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${tab === 'outgoing' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            Outgoing
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          <RefreshCw className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {tab === 'incoming' && (
        <div className="space-y-3">
          {incoming?.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center">
                <HandCoins className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm text-muted-foreground">No one has requested USDC from you yet.</p>
              </CardContent>
            </Card>
          )}
          {incoming?.map((req) => (
            <Card key={req.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-mono font-medium tabular-nums">{req.amount} {req.token}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    From @{req.requester?.username ?? 'unknown'} · {new Date(req.created_at).toLocaleDateString()}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{req.status}</span>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(req)}>
                      <Send className="size-3.5" aria-hidden="true" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decliningId === req.id}
                      onClick={() => handleDecline(req.id)}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'outgoing' && (
        <div className="space-y-3">
          {outgoing?.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center">
                <HandCoins className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm text-muted-foreground">You haven't requested USDC from anyone yet.</p>
              </CardContent>
            </Card>
          )}
          {outgoing?.map((req) => (
            <Card key={req.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-mono font-medium tabular-nums">{req.amount} {req.token}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    To @{req.payer?.username ?? 'unknown'} · {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                  {req.status === 'completed' && <Check className="size-3" aria-hidden="true" />}
                  {req.status === 'declined' && <AlertCircle className="size-3" aria-hidden="true" />}
                  {req.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}