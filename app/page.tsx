'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DumpForm from '@/components/DumpForm'
import FocusCard from '@/components/FocusCard'
import ArchitectReasoning from '@/components/ArchitectReasoning'
import { QueueItem, ArchitectState, ArchitectResponse } from '@/types'

const STORAGE_KEY = 'signal_queue'

export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDumpExpanded, setIsDumpExpanded] = useState(false)

  // Architect state
  const [architectState, setArchitectState] = useState<ArchitectState>({
    isAnalyzing: false,
    reasoning: null
  })

  // Debounce ref for architect analysis
  const architectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Analyze and reorder queue using Curriculum Architect
  const analyzeAndReorderQueue = useCallback(async (
    currentQueue: QueueItem[],
    trigger: 'item_added' | 'item_learned'
  ) => {
    // Skip for single item or empty queues
    if (currentQueue.length <= 1) return

    setArchitectState(prev => ({ ...prev, isAnalyzing: true, reasoning: null }))

    try {
      const response = await fetch('/api/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue: currentQueue.map(item => ({
            id: item.id,
            header: item.header,
            summary: item.summary,
            category: item.category,
            complexityScore: item.complexityScore
          })),
          trigger
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data: ArchitectResponse = await response.json()

      if (data.analysisMetadata.reorderOccurred) {
        setQueue(data.reorderedQueue)
      }

      setArchitectState(prev => ({
        ...prev,
        isAnalyzing: false,
        reasoning: data.reasoning
      }))
    } catch (error) {
      console.error('Architect analysis failed:', error)
      setArchitectState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }, [])

  // Schedule architect analysis with debounce
  const scheduleArchitectAnalysis = useCallback((
    currentQueue: QueueItem[],
    trigger: 'item_added' | 'item_learned'
  ) => {
    if (architectTimeoutRef.current) {
      clearTimeout(architectTimeoutRef.current)
    }

    architectTimeoutRef.current = setTimeout(() => {
      analyzeAndReorderQueue(currentQueue, trigger)
    }, 500) // Wait 500ms for more items before analyzing
  }, [analyzeAndReorderQueue])

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

      setQueue((prev) => {
        const newQueue = [...prev, newItem]
        // Trigger architect analysis after adding item
        scheduleArchitectAnalysis(newQueue, 'item_added')
        return newQueue
      })
      setIsDumpExpanded(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsProcessing(false)
    }
  }, [scheduleArchitectAnalysis])

  const handleMarkLearned = useCallback(() => {
    setQueue((prev) => {
      const newQueue = prev.slice(1)
      // Trigger architect analysis if more than 1 item remains
      if (newQueue.length > 1) {
        setTimeout(() => {
          scheduleArchitectAnalysis(newQueue, 'item_learned')
        }, 300) // After exit animation
      }
      return newQueue
    })
  }, [scheduleArchitectAnalysis])

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

      {/* Architect Reasoning Display */}
      <ArchitectReasoning
        reasoning={architectState.reasoning}
        isAnalyzing={architectState.isAnalyzing}
      />

      {/* Focus Card or Empty State with Animation */}
      <AnimatePresence mode="wait">
        {currentItem ? (
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FocusCard item={currentItem} onMarkLearned={handleMarkLearned} />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-2 border-ink bg-paper p-8 text-center"
          >
            <p className="text-faded">All clear. Stay focused.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Count */}
      {remainingCount > 0 && (
        <motion.p
          key={remainingCount}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-faded"
        >
          {remainingCount} more in signal
        </motion.p>
      )}
    </div>
  )
}
