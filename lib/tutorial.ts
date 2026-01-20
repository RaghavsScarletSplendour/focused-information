import { QueueItem } from '@/types'

// LocalStorage keys for tutorial state
export const TUTORIAL_COMPLETED_KEY = 'focus_first_tutorial_completed'
export const TUTORIAL_STARTED_KEY = 'focus_first_tutorial_started'

// Tutorial card definitions
export const TUTORIAL_CARDS: Array<{
  step: number
  header: string
  summary: string
}> = [
  {
    step: 1,
    header: 'Welcome to Focus First',
    summary: `You just found your calm in the chaos of AI news.

Focus First shows you one thing at a time. No infinite scroll. No distractions.

Press 'Mark as Learned' below to continue.`,
  },
  {
    step: 2,
    header: 'Your Queue Learns With You',
    summary: `Every time you add content, our Curriculum Architect reorganizes your queue.

It puts foundational concepts first and groups related topics together.

Press 'Mark as Learned' to see it in action.`,
  },
  {
    step: 3,
    header: 'Now, Add Something Real',
    summary: `Paste a link or some text about AI/ML in the form above.

Watch the Architect organize your learning path.

This is your last tutorial card. After this, you're on your own!`,
  },
]

/**
 * Check if we should seed tutorial cards for a new user
 * Returns true if: tutorial not completed, not started, and queue is empty
 */
export function shouldSeedTutorial(queueIsEmpty: boolean): boolean {
  if (typeof window === 'undefined') return false

  const completed = localStorage.getItem(TUTORIAL_COMPLETED_KEY)
  const started = localStorage.getItem(TUTORIAL_STARTED_KEY)

  // Don't seed if tutorial was already completed
  if (completed === 'true') return false

  // Don't seed if tutorial was already started (cards already exist)
  if (started === 'true') return false

  // Only seed if queue is empty
  return queueIsEmpty
}

/**
 * Create tutorial QueueItem objects
 */
export function createTutorialCards(): QueueItem[] {
  // Mark tutorial as started
  if (typeof window !== 'undefined') {
    localStorage.setItem(TUTORIAL_STARTED_KEY, 'true')
  }

  return TUTORIAL_CARDS.map((card) => ({
    id: `tutorial-${card.step}`,
    rawContent: card.summary,
    header: card.header,
    summary: card.summary,
    status: 'queued' as const,
    createdAt: Date.now() - (3 - card.step) * 1000, // Ensure correct order
    isTutorial: true,
    tutorialStep: card.step,
  }))
}

/**
 * Mark tutorial as completed
 */
export function markTutorialCompleted(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true')
  }
}

/**
 * Check if a queue item is a tutorial card
 */
export function isTutorialCard(item: QueueItem): boolean {
  return item.isTutorial === true
}

/**
 * Get the total number of tutorial cards
 */
export function getTutorialCardCount(): number {
  return TUTORIAL_CARDS.length
}
