'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  KeyRound,
  Lock,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react';

interface FlowNode {
  id: string;
  stepNumber: number;
  label: string;
  role: string;
  icon: typeof User;
  detail: string;
  statusText: string;
  badge: string;
}

const FLOW_NODES: FlowNode[] = [
  {
    id: 'sender',
    stepNumber: 0,
    label: '1. Sender Origin',
    role: 'Privy Embedded Wallet',
    icon: User,
    detail: 'Authorizes 25.00 USDC transfer to @bob',
    statusText: 'Signed via Google/Email',
    badge: 'Origin',
  },
  {
    id: 'protocol',
    stepNumber: 1,
    label: '2. SwiftPay Core',
    role: 'Routing & Validation',
    icon: Cpu,
    detail: 'Resolves recipient address & prepares payload',
    statusText: 'Handle Resolved',
    badge: 'Protocol',
  },
  {
    id: 'helius',
    stepNumber: 2,
    label: '3. Helius Privacy',
    role: 'Zero-Knowledge Engine',
    icon: ShieldCheck,
    detail: 'Encrypts transfer amount & generates ZK proof',
    statusText: 'Amount Shielded: ●●●●',
    badge: 'ZK Circuits',
  },
  {
    id: 'solana',
    stepNumber: 3,
    label: '4. Solana Devnet',
    role: 'Settlement Ledger',
    icon: Zap,
    detail: 'Fast on-chain finality without amount broadcast',
    statusText: 'Block Confirmed (<400ms)',
    badge: 'Devnet',
  },
  {
    id: 'recipient',
    stepNumber: 4,
    label: '5. Recipient',
    role: '@bob Protected Balance',
    icon: CheckCircle2,
    detail: 'USDC deposited into confidential private balance',
    statusText: 'Settled Privately',
    badge: 'Complete',
  },
];

export function PaymentFlowchart() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FLOW_NODES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const restartFlow = () => {
    setActiveStep(0);
    setIsPlaying(true);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-sm overflow-hidden">
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-sans font-bold text-lg text-slate-900 tracking-tight">
              Live Payment Flowchart
            </h3>
            <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Interactive Data Flow
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-slate-500">
            Real-time visualization of a zero-knowledge USDC payment moving across the network.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center gap-1.5"
            title={isPlaying ? 'Pause animation' : 'Resume animation'}
          >
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            type="button"
            onClick={restartFlow}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center gap-1.5"
            title="Restart flow animation"
          >
            <RotateCcw className="size-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="py-6">
        <div className="relative flex items-center justify-between">
          {/* Connector Line Background */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full" />
          
          {/* Animated Active Connector Line */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full transition-all duration-700 ease-in-out"
            style={{ width: `${(activeStep / (FLOW_NODES.length - 1)) * 100}%` }}
          />

          {FLOW_NODES.map((node, index) => {
            const isCompleted = index < activeStep;
            const isCurrent = index === activeStep;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  setActiveStep(index);
                  setIsPlaying(false);
                }}
                className="relative z-10 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110 shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-slate-300'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span
                  className={`mt-2 font-mono text-[10px] hidden sm:block font-medium uppercase tracking-wider transition-colors ${
                    isCurrent ? 'text-emerald-700 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {node.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated Node-Based Diagram Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-2">
        {FLOW_NODES.map((node, index) => {
          const isCurrent = index === activeStep;
          const isPassed = index < activeStep;
          const Icon = node.icon;

          return (
            <div
              key={node.id}
              onClick={() => {
                setActiveStep(index);
                setIsPlaying(false);
              }}
              className={`cursor-pointer rounded-2xl p-4 transition-all duration-400 border text-left flex flex-col justify-between relative select-none ${
                isCurrent
                  ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm transform -translate-y-1'
                  : isPassed
                  ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  : 'bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Traveling Packet Pulse Indicator */}
              {isCurrent && (
                <span className="absolute -top-1.5 -right-1.5 size-3 bg-emerald-500 rounded-full ring-4 ring-emerald-100 animate-pulse" />
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span
                    className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                      isCurrent
                        ? 'bg-emerald-100 text-emerald-800'
                        : isPassed
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {node.badge}
                  </span>
                </div>

                <h4 className="font-sans font-bold text-xs text-slate-900 leading-snug">
                  {node.label}
                </h4>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                  {node.role}
                </p>
                <p className="font-sans text-[11px] text-slate-600 mt-2 leading-relaxed">
                  {node.detail}
                </p>
              </div>

              {/* Node Live Status Pill */}
              <div
                className={`mt-4 pt-2.5 border-t font-mono text-[10px] flex items-center gap-1.5 ${
                  isCurrent
                    ? 'border-emerald-200 text-emerald-800 font-semibold'
                    : isPassed
                    ? 'border-slate-100 text-slate-700'
                    : 'border-slate-100 text-slate-400'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    isCurrent ? 'bg-emerald-500 animate-ping' : isPassed ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                <span className="truncate">{node.statusText}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Data Packet Inspector Banner */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs shadow-inner">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="size-3.5" />
            Active Packet:
          </span>
          <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-200">
            Recipient: <span className="text-white font-bold">@bob</span>
          </span>
          <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-200">
            Amount on Ledger:{' '}
            <span className={activeStep >= 2 ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
              {activeStep >= 2 ? '●●●●●● (Shielded via ZK)' : '25.00 USDC (In Memory)'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>Speed: <span className="text-white">&lt;400ms finality</span></span>
          <span>·</span>
          <span>Protocol: <span className="text-emerald-400">Helius Privacy v0.3</span></span>
        </div>
      </div>
    </div>
  );
}
