'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DumpForm from '@/components/DumpForm'
import FocusCard from '@/components/FocusCard'
import ArchitectReasoning from '@/components/ArchitectReasoning'
import ArchiveDrawer from '@/components/ArchiveDrawer'
import AuthModal from '@/components/AuthModal'
import ShareModal from '@/components/ShareModal'
import { useAuth } from '@/context/AuthContext'
import { ShareData } from '@/lib/share'
import { useQueue } from '@/hooks/useQueue'
import { useArchive } from '@/hooks/useArchive'
import { QueueItem, ArchitectState, ArchitectResponse, ArchiveItem } from '@/types'

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDumpExpanded, setIsDumpExpanded] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [pendingShareData, setPendingShareData] = useState<ShareData | null>(null)

  const { user, isLoading: isAuthLoading, isConfigured: isAuthConfigured, signOut } = useAuth()
  const { queue, setQueue, isLoading: isQueueLoading, error: queueError, addItem, removeItem } = useQueue()
  const { archive, isLoading: isArchiveLoading, error: archiveError, addToArchive, removeFromArchive } = useArchive()

  // Architect state
  const [architectState, setArchitectState] = useState<ArchitectState>({
    isAnalyzing: false,
    reasoning: null
  })

  // Debounce ref for architect analysis
  const architectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Collapse dump form when queue has items
  const prevQueueLengthRef = useRef(queue.length)
  if (queue.length > 0 && queue.length !== prevQueueLengthRef.current && isDumpExpanded) {
    setIsDumpExpanded(false)
  }
  prevQueueLengthRef.current = queue.length

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
        await setQueue(data.reorderedQueue)
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
  }, [setQueue])

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

      await addItem(newItem)
      setIsDumpExpanded(false)

      // Trigger architect analysis after adding item
      const newQueue = [...queue, newItem]
      scheduleArchitectAnalysis(newQueue, 'item_added')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsProcessing(false)
    }
  }, [addItem, queue, scheduleArchitectAnalysis])

  const handleMarkLearned = useCallback(async () => {
    const learnedItem = queue[0]
    if (!learnedItem) return

    const learnedAt = Date.now()

    // Add to archive with createdAt preserved for share feature
    const archiveItem: ArchiveItem = {
      id: learnedItem.id,
      header: learnedItem.header,
      summary: learnedItem.summary,
      sourceUrl: learnedItem.sourceUrl,
      learnedAt,
      createdAt: learnedItem.createdAt,
    }

    await addToArchive(archiveItem)
    await removeItem(learnedItem.id)

    // Show share modal
    setPendingShareData({
      header: learnedItem.header,
      summary: learnedItem.summary,
      createdAt: learnedItem.createdAt,
      learnedAt,
      sourceUrl: learnedItem.sourceUrl,
    })
    setIsShareModalOpen(true)

    // Trigger architect analysis if more than 1 item remains
    const newQueue = queue.slice(1)
    if (newQueue.length > 1) {
      setTimeout(() => {
        scheduleArchitectAnalysis(newQueue, 'item_learned')
      }, 300) // After exit animation
    }
  }, [queue, addToArchive, removeItem, scheduleArchitectAnalysis])

  const handleRequeue = useCallback(async (item: ArchiveItem) => {
    // Remove from archive
    await removeFromArchive(item.id)

    // Add back to queue as a new item
    const requeuedItem: QueueItem = {
      id: crypto.randomUUID(),
      rawContent: item.header,
      header: item.header,
      summary: item.summary,
      status: 'queued',
      createdAt: Date.now(),
      sourceUrl: item.sourceUrl,
    }

    await addItem(requeuedItem)

    // Close archive drawer
    setIsArchiveOpen(false)

    // Trigger architect analysis
    const newQueue = [...queue, requeuedItem]
    scheduleArchitectAnalysis(newQueue, 'item_added')
  }, [removeFromArchive, addItem, queue, scheduleArchitectAnalysis])

  const toggleArchive = useCallback(() => {
    setIsArchiveOpen((prev) => !prev)
  }, [])

  const toggleDump = useCallback(() => {
    setIsDumpExpanded((prev) => !prev)
  }, [])

  // Combined loading state
  const isLoading = isQueueLoading || isArchiveLoading

  // Combined error state
  const displayError = error || queueError || archiveError

  if (isLoading) {
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
      {/* Header with Auth and Archive */}
      <div className="flex justify-between items-center">
        {/* Auth Controls - only show when Supabase is configured */}
        <div className="text-xs">
          {isAuthConfigured ? (
            isAuthLoading ? (
              <span className="text-faded animate-pulse">...</span>
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-faded">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-faded hover:text-ink transition-colors underline underline-offset-2"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-faded hover:text-ink transition-colors underline underline-offset-2"
              >
                Sign in to sync
              </button>
            )
          ) : null}
        </div>

        {/* Archive Toggle */}
        <button
          onClick={toggleArchive}
          className="text-xs text-faded hover:text-ink transition-colors underline underline-offset-2"
        >
          Archive {archive.length > 0 && `(${archive.length})`}
        </button>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="border-2 border-ink bg-paper p-4 text-center rounded-lg">
          <p className="text-sm text-ink">{displayError}</p>
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
            className="border-2 border-ink bg-paper p-8 text-center rounded-lg"
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

      {/* Archive Drawer */}
      <ArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        items={archive}
        onRequeue={handleRequeue}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareData={pendingShareData}
      />
    </div>
  )
}
