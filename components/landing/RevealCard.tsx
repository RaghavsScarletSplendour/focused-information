'use client'

export default function RevealCard() {
  return (
    <div className="border-2 border-ink bg-paper rounded-lg p-6 shadow-card max-w-md w-full">
      {/* Complexity Badge */}
      <div className="mb-4">
        <span className="inline-block px-2 py-1 text-xs border border-faded text-faded rounded-md font-mono">
          Web Development | Level 6/10
        </span>
      </div>

      {/* Header */}
      <h3 className="font-mono text-xl font-semibold mb-3 text-ink">
        Grok 4.20 - Granite
      </h3>

      {/* Summary */}
      <p className="font-mono text-sm text-faded mb-6 leading-relaxed">
        Grok 4.20 is a frontend model evaluated against Gemini 3.0 Pro
        and Opus 4.5. It addresses the need for high-performance
        frontend solutions in design applications.
      </p>

      {/* Action Button */}
      <div className="flex gap-3">
        <button className="btn-learned pointer-events-none">
          Mark as Learned
        </button>
      </div>
    </div>
  )
}
