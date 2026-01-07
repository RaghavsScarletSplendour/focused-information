'use client'

import { useState, useEffect, useCallback } from 'react'
import DumpForm from '@/components/DumpForm'
import LearningCard, { LearningCardData } from '@/components/LearningCard'

const STORAGE_KEY = 'focus-first-active-card'

export default function Home() {
  const [activeCard, setActiveCard] = useState<LearningCardData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load active card from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && !parsed.learned) {
          setActiveCard(parsed)
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save active card to localStorage
  useEffect(() => {
    if (!isLoaded) return

    try {
      if (activeCard) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeCard))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }, [activeCard, isLoaded])

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

      const newCard: LearningCardData = {
        id: crypto.randomUUID(),
        header: data.header,
        whatItIs: data.whatItIs,
        whyItMatters: data.whyItMatters,
        sourceUrl: data.sourceUrl,
        sourceType: data.sourceType,
        createdAt: new Date().toISOString(),
        learned: false,
      }

      setActiveCard(newCard)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleMarkLearned = useCallback(() => {
    if (activeCard) {
      // Optionally store to history
      try {
        const historyKey = 'focus-first-history'
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
        history.unshift({ ...activeCard, learned: true, learnedAt: new Date().toISOString() })
        // Keep only last 50 items
        localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 50)))
      } catch (e) {
        console.error('Failed to save to history:', e)
      }
    }
    setActiveCard(null)
  }, [activeCard])

  // Don't render until we've loaded from localStorage
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-faded text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

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

      {/* Main Content - FOCUS MODE */}
      {activeCard ? (
        // LASER FOCUS: Only show the active card
        <LearningCard card={activeCard} onMarkLearned={handleMarkLearned} />
      ) : (
        // DUMP MODE: Show input form only when no active card
        <DumpForm onSubmit={handleSubmit} isProcessing={isProcessing} />
      )}

      {/* Minimal footer - only when no active card */}
      {!activeCard && (
        <p className="text-center text-xs text-faded mt-8">
          Focus on one thing. Learn it. Then move on.
        </p>
      )}
    </div>
  )
}
