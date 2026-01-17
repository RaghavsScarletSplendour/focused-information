'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { openRazorpayCheckout, RazorpayResponse } from '@/lib/razorpay/client'
import { useAuth } from '@/context/AuthContext'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  currentUsage?: {
    summarizations: { used: number; limit: number }
    items: { used: number; limit: number }
  }
}

export default function PaywallModal({ isOpen, onClose, onSuccess, currentUsage }: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleUpgrade = async () => {
    if (!user) {
      setError('Please sign in first')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create subscription on backend
      const response = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      const { subscriptionId } = await response.json()

      // Open Razorpay checkout
      await openRazorpayCheckout(
        subscriptionId,
        user.email || undefined,
        user.user_metadata?.full_name,
        (response: RazorpayResponse) => {
          console.log('Payment successful:', response)
          onSuccess?.()
          onClose()
        },
        () => {
          setIsLoading(false)
        }
      )
    } catch (err) {
      console.error('Upgrade error:', err)
      setError('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/20 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-paper border-2 border-ink rounded-lg p-8 w-full max-w-md">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold uppercase tracking-wider">
                  Upgrade to Pro
                </h2>
                <button
                  onClick={onClose}
                  className="text-faded hover:text-ink transition-colors text-xl leading-none"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {/* Current Usage */}
              {currentUsage && (
                <div className="mb-6 p-4 border border-faded rounded-lg bg-paper">
                  <p className="text-sm text-faded mb-2">Today&apos;s usage:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Summarizations</span>
                      <span className="font-mono">
                        {currentUsage.summarizations.used}/{currentUsage.summarizations.limit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items added</span>
                      <span className="font-mono">
                        {currentUsage.items.used}/{currentUsage.items.limit}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="mb-6 space-y-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-faded">
                  Pro Benefits
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-ink">+</span>
                    <span>Unlimited summarizations per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ink">+</span>
                    <span>Unlimited items in your queue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ink">+</span>
                    <span>Curriculum Architect AI for optimal learning order</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ink">+</span>
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 border border-ink bg-paper text-sm text-ink rounded-lg">
                  {error}
                </div>
              )}

              {/* Upgrade Button */}
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="btn-process w-full"
              >
                {isLoading ? (
                  <span className="animate-pulse">Opening checkout...</span>
                ) : (
                  'Upgrade Now'
                )}
              </button>

              {/* Note */}
              <p className="mt-4 text-xs text-faded text-center">
                Cancel anytime. Secure payment via Razorpay.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
