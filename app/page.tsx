'use client'

import { useState, useEffect, useCallback } from 'react'
import DumpForm from '@/components/DumpForm'
import FocusCard, { QueueItem } from '@/components/FocusCard'

const STORAGE_KEY = 'signal_queue'

export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDumpExpanded, setIsDumpExpanded] = useState(false)

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setQueue(parsed.filter((item: QueueItem) => item.status === 'queued'))
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save queue to localStorage
  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }, [queue, isLoaded])

  // Collapse dump form when queue has items
  useEffect(() => {
    if (queue.length > 0 && isDumpExpanded) {
      setIsDumpExpanded(false)
    }
  }, [queue.length])

  const handleSubmit = useCallback(async (input: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process input')
      }

      const data = await response.json()

      const newItem: QueueItem = {
        id: crypto.randomUUID(),
        rawContent: input,
        header: data.header,
        summary: data.summary,
        status: 'queued',
        createdAt: Date.now(),
        sourceUrl: data.sourceUrl,
      }

      setQueue((prev) => [...prev, newItem])
      setIsDumpExpanded(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleMarkLearned = useCallback(() => {
    setQueue((prev) => prev.slice(1))
  }, [])

  const toggleDump = useCallback(() => {
    setIsDumpExpanded((prev) => !prev)
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-faded text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  const currentItem = queue[0]
  const remainingCount = queue.length - 1

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="border-2 border-ink bg-paper p-4 text-center">
          <p className="text-sm text-ink">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-faded underline hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dump Form - collapsible when queue has items */}
      {queue.length > 0 ? (
        <DumpForm
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
          isCollapsed={!isDumpExpanded}
          onToggle={toggleDump}
        />
      ) : (
        <DumpForm
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
          isCollapsed={false}
          onToggle={() => {}}
        />
      )}

      {/* Focus Card or Empty State */}
      {currentItem ? (
        <FocusCard key={currentItem.id} item={currentItem} onMarkLearned={handleMarkLearned} />
      ) : (
        <div className="border-2 border-ink bg-paper p-8 text-center">
          <p className="text-faded">All clear. Stay focused.</p>
        </div>
      )}

      {/* Queue Count */}
      {remainingCount > 0 && (
        <p className="text-center text-xs text-faded">
          {remainingCount} more in signal
        </p>
      )}
    </div>
  )
}
