'use client'

import { useState } from 'react'

export interface QueueItem {
  id: string
  rawContent: string
  header: string
  summary: string
  status: 'queued' | 'completed'
  createdAt: number
  sourceUrl?: string | null
}

interface FocusCardProps {
  item: QueueItem
  onMarkLearned: () => void
}

export default function FocusCard({ item, onMarkLearned }: FocusCardProps) {
  const [isMarking, setIsMarking] = useState(false)

  const handleMarkLearned = () => {
    setIsMarking(true)
    setTimeout(() => {
      onMarkLearned()
    }, 300)
  }

  const summaryLines = item.summary.split('\n')

  return (
    <div
      className={`border-2 border-ink bg-paper p-8 transition-all duration-300 ${
        isMarking ? 'opacity-0 translate-y-4' : ''
      }`}
    >
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
        <div className="mb-8 pt-4 border-t border-ink">
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
      <div className="pt-6 border-t-2 border-ink flex justify-center">
        <button
          onClick={handleMarkLearned}
          className="btn-learned"
        >
          Mark as Learned
        </button>
      </div>
    </div>
  )
}
