'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { ArchiveItem } from '@/types'

const HISTORY_KEY = 'focus-first-history'
const MAX_ARCHIVE_ITEMS = 50

interface DatabaseArchiveItem {
  id: string
  user_id: string
  header: string
  summary: string
  source_url: string | null
  learned_at: string
  created_at: string | null
}

// Convert database row to app format
function dbToApp(row: DatabaseArchiveItem): ArchiveItem {
  return {
    id: row.id,
    header: row.header,
    summary: row.summary,
    sourceUrl: row.source_url,
    learnedAt: new Date(row.learned_at).getTime(),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
  }
}

// Convert app format to database insert
function appToDb(item: ArchiveItem, userId: string): Omit<DatabaseArchiveItem, 'learned_at' | 'created_at'> & { learned_at?: string; created_at?: string | null } {
  return {
    id: item.id,
    user_id: userId,
    header: item.header,
    summary: item.summary,
    source_url: item.sourceUrl ?? null,
    learned_at: new Date(item.learnedAt).toISOString(),
    created_at: item.createdAt ? new Date(item.createdAt).toISOString() : null,
  }
}

export function useArchive() {
  const [archive, setArchive] = useState<ArchiveItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const migrationRef = useRef(false)

  // Load archive data
  const fetchArchive = useCallback(async () => {
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
        .from('archive_items')
        .select('*')
        .order('learned_at', { ascending: false })
        .limit(MAX_ARCHIVE_ITEMS)

      if (fetchError) {
        setError(fetchError.message)
        setIsLoading(false)
        return
      }

      setArchive((data || []).map(dbToApp))
    } else {
      // Fetch from localStorage
      try {
        const stored = localStorage.getItem(HISTORY_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setArchive(parsed.slice(0, MAX_ARCHIVE_ITEMS))
          }
        }
      } catch (e) {
        console.error('Failed to load archive from localStorage:', e)
      }
    }

    setIsLoading(false)
  }, [user])

  // Migrate localStorage to Supabase on first login
  const migrateLocalStorage = useCallback(async () => {
    if (!user || migrationRef.current) return

    const migrationKey = `focus-first-history_migrated_${user.id}`
    if (localStorage.getItem(migrationKey)) return

    migrationRef.current = true

    try {
      const stored = localStorage.getItem(HISTORY_KEY)
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
        .slice(0, MAX_ARCHIVE_ITEMS)
        .map((item: ArchiveItem) => appToDb(item, user.id))

      if (itemsToMigrate.length > 0) {
        const { error: insertError } = await supabase
          .from('archive_items')
          .upsert(itemsToMigrate, { onConflict: 'id' })

        if (insertError) {
          console.error('Archive migration error:', insertError)
          return
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(HISTORY_KEY)
      localStorage.setItem(migrationKey, 'true')

      // Refetch to get migrated data
      await fetchArchive()
    } catch (e) {
      console.error('Archive migration failed:', e)
    }
  }, [user, fetchArchive])

  // Initial load and migration
  useEffect(() => {
    fetchArchive()
  }, [fetchArchive])

  useEffect(() => {
    if (user) {
      migrateLocalStorage()
    }
  }, [user, migrateLocalStorage])

  // Save to localStorage when not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(archive))
      } catch (e) {
        console.error('Failed to save archive to localStorage:', e)
      }
    }
  }, [archive, user, isLoading])

  // Add item to archive
  const addToArchive = useCallback(async (item: ArchiveItem) => {
    if (user) {
      const supabase = createClient()
      if (!supabase) return

      const { error: insertError } = await supabase
        .from('archive_items')
        .insert(appToDb(item, user.id))

      if (insertError) {
        setError(insertError.message)
        return
      }

      setArchive(prev => {
        const newArchive = [item, ...prev]
        return newArchive.slice(0, MAX_ARCHIVE_ITEMS)
      })
    } else {
      setArchive(prev => {
        const newArchive = [item, ...prev]
        return newArchive.slice(0, MAX_ARCHIVE_ITEMS)
      })
    }
  }, [user])

  // Remove item from archive
  const removeFromArchive = useCallback(async (id: string) => {
    if (user) {
      const supabase = createClient()
      if (!supabase) return

      const { error: deleteError } = await supabase
        .from('archive_items')
        .delete()
        .eq('id', id)

      if (deleteError) {
        setError(deleteError.message)
        return
      }
    }

    setArchive(prev => prev.filter(item => item.id !== id))
  }, [user])

  return {
    archive,
    isLoading,
    error,
    addToArchive,
    removeFromArchive,
    refetch: fetchArchive,
  }
}
