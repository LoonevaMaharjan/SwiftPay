import Link from 'next/link';
import { ArrowLeft, Banknote, Clock3 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CashOutPage() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center py-8">
      <Card className="w-full overflow-hidden rounded-3xl">
        <CardContent className="relative px-6 py-10 text-center sm:px-12 sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 size-56 rounded-full border border-primary/10" />
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Banknote className="size-8" aria-hidden="true" /></span>
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"><Clock3 className="size-3.5" aria-hidden="true" /> Coming soon</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Cash out</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Withdraw your SwiftPay balance to a supported bank or payment method. Cash out is coming soon.</p>
          <Link href="/dashboard" className={`${buttonVariants({ variant: 'outline' })} mt-7 min-h-11 rounded-xl`}><ArrowLeft className="size-4" aria-hidden="true" /> Back to dashboard</Link>
        </CardContent>
      </Card>
    </div>
  );
}
