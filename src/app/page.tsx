'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ProblemSection } from '@/components/landing/problem-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { DemoPanel } from '@/components/landing/demo-panel';
import { Features } from '@/components/landing/features';
import { Roadmap } from '@/components/landing/roadmap';
import { FinalCta } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  const router = useRouter();

  const handleAuthAction = () => {
    router.push('/coming-soon');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col font-sans">
      <Navbar onSignIn={handleAuthAction} />
      <main className="flex-1">
        <Hero onStartSending={handleAuthAction} />
        <ProblemSection />
        <HowItWorks />
        <DemoPanel />
        <Features />
        <Roadmap />
        <FinalCta onStartSending={handleAuthAction} />
      </main>
      <Footer />
    </div>
  );
}
