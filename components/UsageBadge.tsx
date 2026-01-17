'use client'

import { motion } from 'framer-motion'

interface UsageBadgeProps {
  tier: 'free' | 'pro'
  used: number
  limit: number
  onClick?: () => void
}

export default function UsageBadge({ tier, used, limit, onClick }: UsageBadgeProps) {
  const isUnlimited = !isFinite(limit)
  const isAtLimit = !isUnlimited && used >= limit
  const isNearLimit = !isUnlimited && used >= limit - 1

  if (tier === 'pro') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase tracking-wider border-2 border-ink rounded-lg bg-ink text-paper"
      >
        Pro
      </motion.div>
    )
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono border-2 rounded-lg transition-colors ${
        isAtLimit
          ? 'border-ink bg-ink text-paper'
          : isNearLimit
          ? 'border-ink text-ink hover:bg-ink hover:text-paper'
          : 'border-faded text-faded hover:border-ink hover:text-ink'
      }`}
      title={isAtLimit ? 'Daily limit reached. Click to upgrade.' : 'Click to upgrade to Pro'}
    >
      <span>{used}/{limit}</span>
      {isAtLimit && <span className="ml-1">Upgrade</span>}
    </motion.button>
  )
}
