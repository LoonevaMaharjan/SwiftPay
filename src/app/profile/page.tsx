'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

type UserProfile = {
  username: string
  email: string
  wallet_address: string
}

export default function ProfilePage() {
  const { user, ready } = usePrivy()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready || !user?.id) return

    async function fetchProfile() {
      const res = await fetch(`/api/users/profile?privy_user_id=${encodeURIComponent(user!.id)}`)
      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        setError(data.error || 'Failed to load profile')
        return
      }

      setProfile(data.user)
    }

    fetchProfile()
  }, [ready, user])

  if (!ready || loading) return <p className="text-center mt-20">Loading...</p>
  if (error) return <p className="text-center mt-20 text-red-600">{error}</p>
  if (!profile) return null

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded space-y-3">
      <h1 className="text-2xl font-bold">Your Profile</h1>
      <p><span className="font-semibold">Username:</span> @{profile.username}</p>
      <p><span className="font-semibold">Email:</span> {profile.email}</p>
      <p><span className="font-semibold">Wallet:</span> {profile.wallet_address}</p>
    </div>
  )
}