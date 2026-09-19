'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWalletAddress } from '@/hooks/use-wallet-address'

export default function OnboardingPage() {
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const { ready: privyReady, getAccessToken } = usePrivy()
  const { address: walletAddress, ready: walletReady } = useWalletAddress()

  async function checkUsername(value: string) {
    setUsername(value)
    setAvailable(null)
    setError('')

    if (value.length < 3) return

    setChecking(true)
    const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(value)}`)
    const data = await res.json()
    setChecking(false)

    if (res.ok) {
      setAvailable(data.available)
    }
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
    console.log('DEBUG TOKEN:', token)

    const res = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username, wallet_address: walletAddress }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    router.push('/profile')
  }

  const notReady = !privyReady || !walletReady

  return (
    <div className="max-w-sm mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-4">Choose your username</h1>
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || notReady || available === false || username.length < 3}
          className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : notReady ? 'Loading wallet...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}