'use client'

import { useState } from 'react'
import { QueueItem } from '@/types'
import { isTutorialCard, getTutorialCardCount } from '@/lib/tutorial'

interface FocusCardProps {
  item: QueueItem
  onMarkLearned: () => void
  onDelete: () => void
}

export default function FocusCard({ item, onMarkLearned, onDelete }: FocusCardProps) {
  const [isMarking, setIsMarking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleMarkLearned = () => {
    setIsMarking(true)
    setTimeout(() => {
      onMarkLearned()
    }, 300)
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    setIsDeleting(true)
    setTimeout(() => {
      onDelete()
    }, 300)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const summaryLines = item.summary.split('\n')
  const isTutorial = isTutorialCard(item)

  return (
    <div
      className={`border-2 bg-paper p-8 transition-all duration-300 rounded-lg ${
        isTutorial ? 'border-dashed border-faded' : 'border-ink'
      } ${(isMarking || isDeleting) ? 'opacity-0 translate-y-4' : ''}`}
    >
      {/* Tutorial Badge or Complexity Badge */}
      {isTutorial ? (
        <div className="mb-4">
          <span className="inline-block px-2 py-1 text-xs border border-faded text-faded rounded-md">
            Tutorial {item.tutorialStep}/{getTutorialCardCount()}
          </span>
        </div>
      ) : item.complexityScore && (
        <div className="mb-4">
          <span className="inline-block px-2 py-1 text-xs border border-faded text-faded rounded-md">
            {item.category || 'General'} | Level {item.complexityScore}/10
          </span>
        </div>
      )}

      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 leading-tight">
        {item.header}
      </h1>

      {/* Summary */}
      <div className="space-y-2 mb-8">
        {summaryLines.map((line, i) => (
          <p key={i} className="text-ink leading-relaxed">
            {line}
          </p>
        ))}
      </div>

      {/* Source Link */}
      {item.sourceUrl && (
        <div className="mb-8">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-faded underline underline-offset-4 hover:text-ink transition-colors break-all text-sm"
          >
            {item.sourceUrl}
          </a>
        </div>
      )}

      {/* Action */}
      <div className="pt-6">
        {showDeleteConfirm ? (
          <div className="flex flex-col items-center gap-3">
            <span className="text-faded text-sm">Delete this item?</span>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-3 border-2 border-faded text-faded rounded-lg font-mono font-semibold uppercase tracking-wider text-sm hover:border-ink hover:text-ink transition-all duration-200"
              >
                No
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-3 border-2 border-ink bg-ink text-paper rounded-lg font-mono font-semibold uppercase tracking-wider text-sm hover:bg-transparent hover:text-ink transition-all duration-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-3">
            {/* Hide delete button for tutorial cards */}
            {!isTutorial && (
              <button
                onClick={handleDeleteClick}
                className="px-4 py-3 border-2 border-faded text-faded rounded-lg font-mono text-xl font-semibold hover:border-ink hover:text-ink transition-all duration-200"
                title="Remove from queue"
                aria-label="Delete this item"
              >
                &times;
              </button>
            )}
            <button
              onClick={handleMarkLearned}
              className="btn-learned"
            >
              Mark as Learned
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
