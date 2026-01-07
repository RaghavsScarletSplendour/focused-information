'use client'

import { useState } from 'react'

interface DumpFormProps {
  onSubmit: (input: string) => Promise<void>
  isProcessing: boolean
}

export default function DumpForm({ onSubmit, isProcessing }: DumpFormProps) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return
    await onSubmit(input.trim())
    setInput('')
  }

  return (
    <div className="work-order p-8 shadow-card">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-dashed border-faded">
        <h1 className="text-2xl font-bold mb-2">Focus First</h1>
        <p className="text-faded text-sm">
          One thing to learn today, and nothing else.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Instructions */}
        <div className="text-sm text-faded space-y-1">
          <p>→ Paste a URL (article, GitHub repo, paper)</p>
          <p>→ Or paste raw text (X thread, notes, excerpt)</p>
        </div>

        {/* Input Area */}
        <div>
          <label htmlFor="dump-input" className="sr-only">
            Your input
          </label>
          <textarea
            id="dump-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste URL or text here..."
            rows={6}
            disabled={isProcessing}
            className="w-full bg-transparent border-2 border-ink p-4 font-mono text-ink placeholder:text-faded resize-none focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-paper disabled:opacity-50"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="btn-process"
          >
            {isProcessing ? (
              <>
                <span className="animate-pulse mr-2">◉</span>
                Processing...
              </>
            ) : (
              <>
                Process
                <span className="ml-2">→</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer hint */}
      <div className="mt-8 pt-4 border-t border-dashed border-faded">
        <p className="text-xs text-faded text-center">
          We strip the hype. You get the signal.
        </p>
      </div>
    </div>
  )
}
