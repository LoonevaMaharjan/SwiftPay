'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin, usePrivy } from '@privy-io/react-auth';
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
  const { authenticated, ready, getAccessToken } = usePrivy();
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  const navigateToApp = async () => {
    if (navigating) return;
    setNavigating(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push(response.ok ? '/dashboard' : '/onboarding');
    } catch {
      router.push('/onboarding');
    } finally {
      setNavigating(false);
    }
  };

  const { login } = useLogin({
    onComplete: () => {
      void navigateToApp();
    },
  });

  const handleAuthAction = () => {
    if (!ready || navigating) return;
    if (authenticated) {
      void navigateToApp();
    } else {
      login();
    }
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
