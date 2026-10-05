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

  const { ready: privyReady, getAccessToken, user } = usePrivy()
  const { address: walletAddress, ready: walletReady } = useWalletAddress()

  useEffect(() => {
    if (user?.email?.address) {
      setEmail(user.email.address)
    }
  }, [user])

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
    router.push('/dashboard/profile')
  }

  const notReady = !privyReady || !walletReady

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Choose your username</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => checkUsername(e.target.value)}
              placeholder="username"
              className="w-full border rounded px-3 py-2"
              minLength={3}
              required
            />
            {checking && <p className="text-sm text-gray-500">Checking...</p>}
            {available === true && <p className="text-sm text-green-600">Username available</p>}
            {available === false && <p className="text-sm text-red-600">Username taken</p>}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full border rounded px-3 py-2"
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="submit"
              disabled={submitting || notReady || available === false || username.length < 3}
              className="w-full"
            >
              {submitting ? 'Creating...' : notReady ? 'Loading wallet...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}