export interface QueueItem {
  id: string
  rawContent: string
  header: string
  summary: string
  status: 'queued' | 'completed'
  createdAt: number
  sourceUrl?: string | null
  // Curriculum Architect fields
  category?: string
  complexityScore?: number
  sequenceOrder?: number
}

export interface ArchitectRequest {
  queue: Array<{
    id: string
    header: string
    summary: string
    category?: string
    complexityScore?: number
  }>
  trigger: 'item_added' | 'item_learned'
  newItemId?: string
}

export interface ArchitectResponse {
  reorderedQueue: QueueItem[]
  reasoning: string
  analysisMetadata: {
    itemsAnalyzed: number
    reorderOccurred: boolean
  }
}

export interface ArchitectState {
  isAnalyzing: boolean
  reasoning: string | null
}

export interface ArchiveItem {
  id: string
  header: string
  summary: string
  sourceUrl?: string | null
  learnedAt: number
  createdAt?: number
}
