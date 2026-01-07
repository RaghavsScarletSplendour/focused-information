'use client'

import { useState } from 'react'

export interface LearningCardData {
  id: string
  header: string
  whatItIs: string
  whyItMatters: string
  sourceUrl: string | null
  sourceType: 'url' | 'text'
  createdAt: string
  learned: boolean
}

interface LearningCardProps {
  card: LearningCardData
  onMarkLearned: () => void
}

export default function LearningCard({ card, onMarkLearned }: LearningCardProps) {
  const [isMarking, setIsMarking] = useState(false)

  const handleMarkLearned = () => {
    setIsMarking(true)
    setTimeout(() => {
      onMarkLearned()
    }, 300)
  }

  const formattedDate = new Date(card.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className={`work-order p-8 shadow-card transition-all duration-300 ${isMarking ? 'opacity-0 translate-y-4' : ''}`}>
      {/* Header strip */}
      <div className="mb-6 pb-4 border-b border-dashed border-faded">
        <div className="flex justify-between items-start gap-4">
          <span className="text-xs text-faded uppercase tracking-widest">
            Learning Card #{card.id.slice(0, 6)}
          </span>
          <span className="text-xs text-faded">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Topic Header */}
      <h1 className="text-2xl font-bold mb-6 leading-tight">
        {card.header}
      </h1>

      {/* Summary Section */}
      <div className="space-y-4 mb-8">
        <div className="flex gap-3">
          <span className="text-faded text-sm shrink-0 w-20 pt-0.5">What:</span>
          <p className="text-ink leading-relaxed">{card.whatItIs}</p>
        </div>
        <div className="flex gap-3">
          <span className="text-faded text-sm shrink-0 w-20 pt-0.5">Why:</span>
          <p className="text-ink leading-relaxed">{card.whyItMatters}</p>
        </div>
      </div>

      {/* Source Link */}
      {card.sourceUrl && (
        <div className="mb-8 pt-4 border-t border-dashed border-faded">
          <span className="text-xs text-faded uppercase tracking-widest block mb-2">
            Source
          </span>
          <a
            href={card.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-4 hover:text-faded transition-colors break-all text-sm"
          >
            {card.sourceUrl}
          </a>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-6 border-t-2 border-ink flex justify-center">
        <button
          onClick={handleMarkLearned}
          className="btn-learned group"
        >
          <span className="mr-2 text-lg group-hover:scale-110 transition-transform inline-block">
            ✓
          </span>
          Mark as Learned
        </button>
      </div>

      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-ink border-l-[40px] border-l-transparent" />
    </div>
  )
}
