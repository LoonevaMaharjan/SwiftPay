'use client';

import { useState } from 'react';
import {
  ArrowRight,
  AtSign,
  Check,
  Clock,
  Copy,
  Link2,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  time: string;
  description: string;
  amount: string;
  status: 'completed' | 'processing';
  method: string;
}

const initialActivities: ActivityItem[] = [
  {
    id: 'act-1',
    time: 'Just now',
    description: 'Sent 25 USDC to @looneva',
    amount: '25.00 USDC',
    status: 'completed',
    method: 'Username',
  },
  {
    id: 'act-2',
    time: '3m ago',
    description: 'Payment link claimed by @sarah',
    amount: '15.00 USDC',
    status: 'completed',
    method: 'Payment Link',
  },
  {
    id: 'act-3',
    time: '18m ago',
    description: 'Received 100 USDC from alex@domain.com',
    amount: '100.00 USDC',
    status: 'completed',
    method: 'Email',
  },
];

export function DemoPanel() {
  const [activeTab, setActiveTab] = useState<'username' | 'email' | 'link'>('username');
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [selectedAmount, setSelectedAmount] = useState('25.00');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSimulate = (overrideTab?: 'username' | 'email' | 'link') => {
    const tab = overrideTab || activeTab;
    const newId = 'act-' + Date.now();
    let desc = '';
    let method = 'Username';

    if (tab === 'username') {
      desc = `Sent ${selectedAmount} USDC to @looneva`;
      method = 'Username';
    } else if (tab === 'email') {
      desc = `Sent ${selectedAmount} USDC to alex@domain.com`;
      method = 'Email';
    } else {
      desc = `Generated private link for ${selectedAmount} USDC`;
      method = 'Payment Link';
    }

    const newItem: ActivityItem = {
      id: newId,
      time: 'Just now',
      description: desc,
      amount: `${selectedAmount} USDC`,
      status: 'completed',
      method,
    };

    setActivities((prev) => [newItem, ...prev.slice(0, 3)]);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText('https://swiftpay.sol/pay/looneva?amt=25');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <section className="py-16 sm:py-20 border-t border-slate-200/80 bg-slate-50/50">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-semibold tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 mb-3">
            Interactive Demo
          </div>
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
            Pay the way{' '}
            <span className="text-emerald-600">
              you want.
            </span>
          </h2>
          <p className="mt-3 font-sans text-base text-slate-600 leading-relaxed">
            Test any payment method below to preview the shielded transfer flow.
          </p>
        </div>

        {/* Demo Grid */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Clean Payment Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            {/* Tab switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('username');
                  handleSimulate('username');
                }}
                className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'username' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AtSign className="size-3.5" />
                <span>Handle</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('email');
                  handleSimulate('email');
                }}
                className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'email' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="size-3.5" />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('link');
                  handleSimulate('link');
                }}
                className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'link' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link2 className="size-3.5" />
                <span>Payment Link</span>
              </button>
            </div>

            {/* Form Details */}
            <div className="space-y-4">
              {activeTab === 'username' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-mono">
                    Recipient Handle
                  </label>
                  <div className="flex items-center px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm text-slate-900">
                    <span className="text-slate-400 mr-1">@</span>
                    <span>looneva</span>
                    <span className="ml-auto text-xs text-emerald-600 font-sans font-medium">Verified recipient</span>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-mono">
                    Recipient Email
                  </label>
                  <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm text-slate-900 flex justify-between items-center">
                    <span>alex@domain.com</span>
                    <span className="text-xs text-emerald-600 font-sans font-medium">Wallet ready</span>
                  </div>
                </div>
              )}

              {activeTab === 'link' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-mono">
                    Shareable Payment Link
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-700 truncate">
                      https://swiftpay.sol/pay/looneva
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      {copiedLink ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Amount selector pills */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 font-mono">
                  Amount
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['10.00', '25.00', '50.00'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSelectedAmount(amt)}
                      className={`py-2 rounded-xl border text-sm font-mono font-medium transition-colors ${
                        selectedAmount === amt
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {amt} USDC
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSimulate()}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Simulate private payment</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Right Panel: Live Activity Ledger */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-sans font-semibold text-sm text-slate-900">
                  Devnet Activity Log
                </h3>
              </div>
              <span className="font-mono text-[10px] text-emerald-700 font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60">
                live feed
              </span>
            </div>

            <div className="space-y-2.5">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-500">{item.time}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-[10px] text-emerald-700 font-medium">Amount Shielded</span>
                    </div>
                    <p className="font-sans font-medium text-slate-900 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-semibold text-slate-900 block">{item.amount}</span>
                    <span className="text-[10px] text-emerald-600 font-mono">Confirmed</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] font-mono text-slate-400 text-center">
              Demonstration sandbox · Transactions verified via Helius Privacy ZK circuits
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
