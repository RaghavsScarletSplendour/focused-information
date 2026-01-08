'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArchiveItem } from '@/types'

interface ArchiveDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: ArchiveItem[]
  onRequeue: (item: ArchiveItem) => void
}

function formatRelativeDate(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  }
  return 'Just now'
}

export default function ArchiveDrawer({
  isOpen,
  onClose,
  items,
  onRequeue,
}: ArchiveDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/20 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-80 bg-paper border-l-2 border-ink z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b-2 border-ink flex items-center justify-between">
              <h2 className="text-lg font-bold uppercase tracking-wider">
                Archive
              </h2>
              <button
                onClick={onClose}
                className="text-faded hover:text-ink transition-colors text-xl leading-none"
                aria-label="Close archive"
              >
                &times;
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <p className="text-faded text-center py-8">
                  No learned items yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="border-2 border-ink bg-paper p-4"
                    >
                      <h3 className="font-semibold text-sm leading-tight mb-2">
                        {item.header}
                      </h3>
                      <p className="text-xs text-faded mb-3">
                        {formatRelativeDate(item.learnedAt)}
                      </p>
                      <button
                        onClick={() => onRequeue(item)}
                        className="text-xs text-faded hover:text-ink underline underline-offset-2 transition-colors"
                      >
                        Re-queue for review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
