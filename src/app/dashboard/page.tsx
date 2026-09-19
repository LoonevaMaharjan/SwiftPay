import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { BalanceCard } from '@/components/balance-card';

export default function DashboardPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BalanceCard />
      <Card><CardHeader><CardTitle>Send</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">Send USDC on Solana devnet.</p><Link className={buttonVariants()} href="/dashboard/send">Send USDC</Link></CardContent></Card>
      <Card><CardHeader><CardTitle>Receive</CardTitle></CardHeader><CardContent>Member 2 builds this</CardContent></Card>
      <Card><CardHeader><CardTitle>History</CardTitle></CardHeader><CardContent>Coming Day 5</CardContent></Card>
    </div>
  );
}
