'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWalletAddress } from '@/hooks/use-wallet-address'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function OnboardingPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const { ready: privyReady, authenticated, getAccessToken, user } = usePrivy()
  const { address: walletAddress, ready: walletReady } = useWalletAddress()

  useEffect(() => {
    const googleEmail = user?.linkedAccounts.find((account) => account.type === 'google_oauth')?.email
    const accountEmail = user?.email?.address ?? googleEmail
    if (accountEmail) setEmail(accountEmail)
  }, [user])

  useEffect(() => {
    if (!privyReady) return
    if (!authenticated) {
      router.replace('/')
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const token = await getAccessToken()
        const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
        if (response.ok && !cancelled) router.replace('/dashboard')
      } catch {
        // Keep the onboarding form available if profile lookup is temporarily unavailable.
      }
    })()
    return () => { cancelled = true }
  }, [privyReady, authenticated, getAccessToken, router])

  async function checkUsername(value: string) {
    setUsername(value)
    setAvailable(null)
    setError('')
    if (value.length < 3) return
    setChecking(true)
    const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(value)}`)
    const data = await res.json()
    setChecking(false)
    if (res.ok) setAvailable(data.available)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!walletAddress) {
      setError('Still loading your wallet — please wait a moment and try again')
      return
    }
    setSubmitting(true)
    setError('')
    const token = await getAccessToken()
    const res = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username, email, wallet_address: walletAddress }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }
    const recipient = sessionStorage.getItem('swiftpay:post-onboarding-recipient')
    if (recipient) {
      sessionStorage.removeItem('swiftpay:post-onboarding-recipient')
      router.push(`/dashboard/send?recipient=${encodeURIComponent(recipient)}`)
    } else {
      router.push('/dashboard')
    }
  }

  const notReady = !privyReady || !authenticated || !walletReady

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8f5] px-4 py-12 text-[#17231f]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 size-[28rem] rounded-full bg-emerald-200/40 blur-3xl" />
      <Card className="relative w-full max-w-lg overflow-hidden rounded-3xl border-[#e5eae6] bg-white/95 shadow-xl shadow-emerald-950/5">
        <div className="h-1.5 bg-gradient-to-r from-[#153b31] via-[#43816b] to-[#b3d9b6]" />
        <CardHeader className="space-y-3 px-7 pt-8 sm:px-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#43816b]">One last step</p>
          <CardTitle className="text-3xl tracking-tight">Make SwiftPay yours</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">Choose a username people can use to find and pay you.</p>
        </CardHeader>
        <CardContent className="px-7 pb-8 sm:px-9">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Your username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => checkUsername(e.target.value.trim().toLowerCase())}
              placeholder="yourname"
              autoComplete="username"
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#43816b]"
              minLength={3}
              required
            />
            {checking && <p className="text-xs text-muted-foreground">Checking availability…</p>}
            {available === true && <p className="text-xs font-medium text-emerald-700">This username is available.</p>}
            {available === false && <p className="text-xs font-medium text-destructive">That username is already taken.</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Google account</label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              placeholder="Loading your Google email…"
              className="h-12 w-full rounded-xl border border-input bg-muted/55 px-4 text-sm text-muted-foreground outline-none"
              required
            />
              <p className="text-xs text-muted-foreground">Added automatically from your Google sign-in.</p>
            </div>

            {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</p>}
            <Button
              type="submit"
              disabled={submitting || checking || notReady || available !== true || username.length < 3 || !email}
              className="h-12 w-full rounded-xl bg-[#153b31] text-white hover:bg-[#204e41]"
            >
              {submitting ? 'Creating your profile…' : notReady ? 'Preparing your account…' : 'Continue to SwiftPay'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
