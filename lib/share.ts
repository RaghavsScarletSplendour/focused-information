export interface ShareData {
  header: string
  summary: string
  createdAt: number
  learnedAt: number
  sourceUrl?: string | null
}

/**
 * Calculate days an item spent in the learning queue
 */
function calculateDaysInQueue(createdAt: number, learnedAt: number): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const diff = learnedAt - createdAt
  return Math.max(1, Math.floor(diff / msPerDay))
}

/**
 * Truncate text to fit within character limit
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + '...'
}

/**
 * Get first N lines from summary
 */
function getFirstLines(summary: string, lineCount: number): string {
  const lines = summary.split('\n').filter(line => line.trim())
  return lines.slice(0, lineCount).join('\n')
}

/**
 * Build the tweet text for sharing a learned item
 */
export function buildTweetText(data: ShareData): string {
  const daysInQueue = calculateDaysInQueue(data.createdAt, data.learnedAt)
  const daysText = daysInQueue === 1 ? '1 day' : `${daysInQueue} days`

  const summarySnippet = getFirstLines(data.summary, 2)

  // Character budget for 280 limit
  const truncatedHeader = truncateText(data.header, 80)
  const truncatedSummary = truncateText(summarySnippet, 120)

  return `✅ Finally learned: ${truncatedHeader}\n(${daysText} in queue)\n\n${truncatedSummary}\n\nvia Focus First`
}

/**
 * Build the Twitter Web Intent URL
 */
export function buildTwitterIntentUrl(data: ShareData): string {
  const tweetText = buildTweetText(data)
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
}

/**
 * Open Twitter share in a centered popup window
 */
export function shareToTwitter(data: ShareData): void {
  const url = buildTwitterIntentUrl(data)

  const width = 550
  const height = 420
  const left = Math.round((window.innerWidth - width) / 2)
  const top = Math.round((window.innerHeight - height) / 2)

  window.open(
    url,
    'twitter-share',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
  )
}
