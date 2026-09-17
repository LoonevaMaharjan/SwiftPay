import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BalanceCard } from '@/components/balance-card';

export default function DashboardPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <BalanceCard />
      <Card><CardHeader><CardTitle>Send</CardTitle></CardHeader><CardContent>Coming Day 3</CardContent></Card>
      <Card><CardHeader><CardTitle>Receive</CardTitle></CardHeader><CardContent>Member 2 builds this</CardContent></Card>
      <Card><CardHeader><CardTitle>History</CardTitle></CardHeader><CardContent>Coming Day 5</CardContent></Card>
    </div>
  );
}