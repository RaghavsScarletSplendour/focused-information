'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

interface SubscriptionStatus {
  tier: 'free' | 'pro'
  status: string
  summarizations: {
    used: number
    limit: number
  }
  items: {
    used: number
    limit: number
  }
  features: {
    architect: boolean
  }
  authenticated: boolean
}

const defaultStatus: SubscriptionStatus = {
  tier: 'free',
  status: 'active',
  summarizations: { used: 0, limit: 3 },
  items: { used: 0, limit: 3 },
  features: { architect: false },
  authenticated: false,
}

export function useSubscription() {
  const { user, isLoading: authLoading } = useAuth()
  const [status, setStatus] = useState<SubscriptionStatus>(defaultStatus)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/subscription/status')

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status')
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      console.error('Subscription fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
      // Keep default status on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch status when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchStatus()
    }
  }, [user, authLoading, fetchStatus])

  // Computed values
  const canSummarize = status.tier === 'pro' || status.summarizations.used < status.summarizations.limit
  const canCreateItem = status.tier === 'pro' || status.items.used < status.items.limit
  const canUseArchitect = status.features.architect
  const isPro = status.tier === 'pro'

  // Refetch after successful payment
  const refresh = useCallback(() => {
    fetchStatus()
  }, [fetchStatus])

  return {
    // Status
    tier: status.tier,
    status: status.status,
    summarizations: status.summarizations,
    items: status.items,
    features: status.features,
    authenticated: status.authenticated,

    // Computed
    canSummarize,
    canCreateItem,
    canUseArchitect,
    isPro,

    // State
    isLoading: isLoading || authLoading,
    error,

    // Actions
    refresh,
  }
}
