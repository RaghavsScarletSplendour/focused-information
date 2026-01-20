'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { QueueItem } from '@/types'
import { shouldSeedTutorial, createTutorialCards, isTutorialCard } from '@/lib/tutorial'

const STORAGE_KEY = 'signal_queue'

interface DatabaseQueueItem {
  id: string
  user_id: string
  raw_content: string
  header: string
  summary: string
  status: string
  source_url: string | null
  category: string | null
  complexity_score: number | null
  sequence_order: number | null
  created_at: string
}

// Convert database row to app format
function dbToApp(row: DatabaseQueueItem): QueueItem {
  return {
    id: row.id,
    rawContent: row.raw_content,
    header: row.header,
    summary: row.summary,
    status: row.status as 'queued' | 'completed',
    createdAt: new Date(row.created_at).getTime(),
    sourceUrl: row.source_url,
    category: row.category ?? undefined,
    complexityScore: row.complexity_score ?? undefined,
    sequenceOrder: row.sequence_order ?? undefined,
  }
}

// Convert app format to database insert
function appToDb(item: QueueItem, userId: string): Omit<DatabaseQueueItem, 'id' | 'created_at'> & { id?: string } {
  return {
    id: item.id,
    user_id: userId,
    raw_content: item.rawContent,
    header: item.header,
    summary: item.summary,
    status: item.status,
    source_url: item.sourceUrl ?? null,
    category: item.category ?? null,
    complexity_score: item.complexityScore ?? null,
    sequence_order: item.sequenceOrder ?? null,
  }
}

export function useQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const migrationRef = useRef(false)

  // Load queue data
  const fetchQueue = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    if (user) {
      // Fetch from Supabase
      const supabase = createClient()
      if (!supabase) {
        setIsLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('queue_items')
        .select('*')
        .eq('status', 'queued')
        .order('sequence_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
        setIsLoading(false)
        return
      }

      setQueue((data || []).map(dbToApp))
    } else {
      // Fetch from localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            const queuedItems = parsed.filter((item: QueueItem) => item.status === 'queued')
            setQueue(queuedItems)

            // Check if we should seed tutorial cards (no items and tutorial not started/completed)
            if (queuedItems.length === 0 && shouldSeedTutorial(true)) {
              const tutorialCards = createTutorialCards()
              setQueue(tutorialCards)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(tutorialCards))
            }
          }
        } else {
          // No stored queue - check if we should seed tutorial cards
          if (shouldSeedTutorial(true)) {
            const tutorialCards = createTutorialCards()
            setQueue(tutorialCards)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tutorialCards))
          }
        }
      } catch (e) {
        console.error('Failed to load from localStorage:', e)
      }
    }

    setIsLoading(false)
  }, [user])

  // Migrate localStorage to Supabase on first login
  const migrateLocalStorage = useCallback(async () => {
    if (!user || migrationRef.current) return

    const migrationKey = `signal_queue_migrated_${user.id}`
    if (localStorage.getItem(migrationKey)) return

    migrationRef.current = true

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        localStorage.setItem(migrationKey, 'true')
        return
      }

      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(migrationKey, 'true')
        return
      }

      const supabase = createClient()
      if (!supabase) return

      const itemsToMigrate = parsed
        .filter((item: QueueItem) => item.status === 'queued' && !isTutorialCard(item))
        .map((item: QueueItem) => appToDb(item, user.id))

      if (itemsToMigrate.length > 0) {
        const { error: insertError } = await supabase
          .from('queue_items')
          .upsert(itemsToMigrate, { onConflict: 'id' })

        if (insertError) {
          console.error('Migration error:', insertError)
          return
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(migrationKey, 'true')

      // Refetch to get migrated data
      await fetchQueue()
    } catch (e) {
      console.error('Migration failed:', e)
    }
  }, [user, fetchQueue])

  // Initial load and migration
  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  useEffect(() => {
    if (user) {
      migrateLocalStorage()
    }
  }, [user, migrateLocalStorage])

  // Save to localStorage when not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
      } catch (e) {
        console.error('Failed to save to localStorage:', e)
      }
    }
  }, [queue, user, isLoading])

  // Add item to queue
  const addItem = useCallback(async (item: QueueItem) => {
    if (user) {
      const supabase = createClient()
      if (!supabase) return

      const { error: insertError } = await supabase
        .from('queue_items')
        .insert(appToDb(item, user.id))

      if (insertError) {
        setError(insertError.message)
        return
      }

      setQueue(prev => [...prev, item])
    } else {
      setQueue(prev => [...prev, item])
    }
  }, [user])

  // Remove item from queue
  const removeItem = useCallback(async (id: string) => {
    if (user) {
      const supabase = createClient()
      if (!supabase) return

      const { error: deleteError } = await supabase
        .from('queue_items')
        .delete()
        .eq('id', id)

      if (deleteError) {
        setError(deleteError.message)
        return
      }
    }

    setQueue(prev => prev.filter(item => item.id !== id))
  }, [user])

  // Update queue order (for architect reordering)
  const updateQueue = useCallback(async (newQueue: QueueItem[]) => {
    if (user) {
      const supabase = createClient()
      if (!supabase) return

      // Update sequence_order for each item
      const updates = newQueue.map((item, index) => ({
        id: item.id,
        user_id: user.id,
        raw_content: item.rawContent,
        header: item.header,
        summary: item.summary,
        status: item.status,
        source_url: item.sourceUrl ?? null,
        category: item.category ?? null,
        complexity_score: item.complexityScore ?? null,
        sequence_order: index,
      }))

      const { error: updateError } = await supabase
        .from('queue_items')
        .upsert(updates, { onConflict: 'id' })

      if (updateError) {
        setError(updateError.message)
        return
      }
    }

    setQueue(newQueue)
  }, [user])

  return {
    queue,
    setQueue: updateQueue,
    isLoading,
    error,
    addItem,
    removeItem,
    refetch: fetchQueue,
  }
}
