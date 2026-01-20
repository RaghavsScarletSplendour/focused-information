'use client'

import { useState } from 'react'

interface DumpFormProps {
  onSubmit: (input: string) => Promise<void>
  isProcessing: boolean
  isCollapsed: boolean
  onToggle: () => void
  isHighlighted?: boolean
}

export default function DumpForm({
  onSubmit,
  isProcessing,
  isCollapsed,
  onToggle,
  isHighlighted = false,
}: DumpFormProps) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return
    await onSubmit(input.trim())
    setInput('')
  }

  // Force expanded when highlighted (tutorial card 3)
  const shouldExpand = isHighlighted || !isCollapsed

  if (!shouldExpand) {
    return (
      <button
        onClick={onToggle}
        className="w-full border-2 border-ink bg-paper p-4 text-left text-faded hover:text-ink hover:bg-paper transition-colors rounded-lg"
      >
        + Dump AI News/Links
      </button>
    )
  }

  return (
    <div className={`border-2 bg-paper p-8 rounded-lg ${
      isHighlighted
        ? 'border-ink animate-pulse ring-2 ring-ink ring-offset-2 ring-offset-paper'
        : 'border-ink'
    }`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Label */}
        <label htmlFor="dump-input" className="block text-sm text-faded">
          Dump AI News/Links
        </label>

        {/* Input Area */}
        <textarea
          id="dump-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste URL or text..."
          rows={4}
          disabled={isProcessing}
          autoFocus
          className="w-full bg-transparent border-2 border-ink p-4 font-mono text-ink placeholder:text-faded resize-none focus:outline-none disabled:opacity-50 rounded-lg"
        />

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onToggle}
            className="text-sm text-faded hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="btn-process"
          >
            {isProcessing ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              'Queue'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
