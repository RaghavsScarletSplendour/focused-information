'use client'

import Link from 'next/link'

export default function RevealCard() {
  return (
    <div className="border-2 border-ink bg-paper rounded-lg p-6 shadow-card max-w-md w-full">
      {/* Complexity Badge */}
      <div className="mb-4">
        <span className="inline-block px-2 py-1 text-xs border border-faded text-faded rounded-md font-mono">
          Focus First | One Thing at a Time
        </span>
      </div>

      {/* Header */}
      <h3 className="font-mono text-xl font-semibold mb-3 text-ink">
        Find Your Focus
      </h3>

      {/* Summary */}
      <p className="font-mono text-sm text-faded mb-6 leading-relaxed">
        Welcome to clarity. One insight at a time, no distractions.
        Focus First helps you learn what matters in AI/ML - without
        the noise.
      </p>

      {/* Action Button */}
      <div className="flex gap-3">
        <Link href="/auth" className="btn-learned">
          Get Started
        </Link>
      </div>
    </div>
  )
}
