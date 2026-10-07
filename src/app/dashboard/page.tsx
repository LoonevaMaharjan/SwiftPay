import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { BalanceCard } from '@/components/balance-card';

export default function DashboardPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <BalanceCard />
      <Card><CardHeader><CardTitle>Send USDC</CardTitle><CardDescription>Pay a SwiftPay user by username, email, or wallet.</CardDescription></CardHeader><CardContent><Link className={buttonVariants()} href="/dashboard/send">Start a payment</Link></CardContent></Card>
      <Card><CardHeader><CardTitle>Receive</CardTitle><CardDescription>Share your username payment link or QR code.</CardDescription></CardHeader><CardContent><Link className={buttonVariants({ variant: 'outline' })} href="/dashboard/receive">Receive USDC</Link></CardContent></Card>
      <Card><CardHeader><CardTitle>History</CardTitle><CardDescription>Review sent, received, and synced private transfers.</CardDescription></CardHeader><CardContent><Link className={buttonVariants({ variant: 'outline' })} href="/dashboard/history">View payment history</Link></CardContent></Card>
    </div>
  );
}
