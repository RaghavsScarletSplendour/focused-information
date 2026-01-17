import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { QueueItem, ArchitectRequest, ArchitectResponse } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { checkProFeature } from '@/lib/subscription'

const ARCHITECT_SYSTEM_PROMPT = `You are a curriculum architect for a focused learning system. Analyze a queue of learning items and determine the optimal order for understanding.

PRINCIPLES:
1. Foundational concepts before advanced applications
2. Related topics grouped but ordered by complexity
3. Prerequisites must come before dependent topics
4. Maintain momentum - don't front-load all difficult items

ANALYSIS REQUIREMENTS:
For each item, assess:
- Category: The high-level domain (e.g., "Machine Learning", "Web Development", "Systems Design", "Data Science")
- Complexity: 1-10 scale where 1=basic concept, 5=intermediate, 10=advanced research
- Prerequisites: Which other items in the queue should be learned first

OUTPUT FORMAT (JSON):
{
  "items": [
    {
      "id": "item-uuid",
      "category": "string",
      "complexity_score": 1-10,
      "prerequisites": ["array of IDs from queue"]
    }
  ],
  "suggested_order": ["array of all IDs in optimal learning sequence"],
  "reasoning": "One clear sentence explaining the ordering logic"
}

CONSTRAINTS:
- Only reference IDs that exist in the provided queue
- suggested_order must contain ALL item IDs exactly once
- Keep reasoning under 100 characters
- If only 1 item exists, return it as-is with basic categorization

Respond ONLY with valid JSON.`

interface GPTAnalysisItem {
  id: string
  category: string
  complexity_score: number
  prerequisites: string[]
}

interface GPTAnalysisResponse {
  items: GPTAnalysisItem[]
  suggested_order: string[]
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ArchitectRequest = await request.json()
    const { queue, trigger, newItemId } = body

    if (!queue || !Array.isArray(queue) || queue.length === 0) {
      return NextResponse.json(
        { error: 'Queue is required and must not be empty' },
        { status: 400 }
      )
    }

    // Check if user has pro access for Architect feature
    const supabase = await createClient()
    const user = supabase ? (await supabase.auth.getUser()).data.user : null

    if (user) {
      const hasAccess = await checkProFeature(user.id, 'architect')
      if (!hasAccess) {
        return NextResponse.json(
          {
            error: 'Pro subscription required',
            code: 'PRO_REQUIRED',
          },
          { status: 403 }
        )
      }
    }

    // Skip analysis for single-item queues
    if (queue.length === 1) {
      return NextResponse.json({
        reorderedQueue: queue.map((item, index) => ({
          ...item,
          category: 'General',
          complexityScore: 5,
          sequenceOrder: index
        })),
        reasoning: 'Single item - no reordering needed',
        analysisMetadata: { itemsAnalyzed: 1, reorderOccurred: false }
      })
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.warn('No OPENAI_API_KEY found, using mock response')
      return NextResponse.json(generateMockResponse(queue))
    }

    const openai = new OpenAI({ apiKey })

    // Prepare queue summary for GPT
    const queueSummary = queue.map(item => ({
      id: item.id,
      header: item.header,
      summary: item.summary
    }))

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ARCHITECT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this learning queue and suggest optimal order:\n\n${JSON.stringify(queueSummary, null, 2)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No response from LLM')
    }

    const parsed: GPTAnalysisResponse = JSON.parse(responseText)

    // Validate and reorder queue
    const reorderedQueue = reorderQueue(queue, parsed)
    const hasOrderChanged = checkOrderChanged(queue, reorderedQueue)

    const response: ArchitectResponse = {
      reorderedQueue,
      reasoning: parsed.reasoning || 'Queue optimized for learning progression',
      analysisMetadata: {
        itemsAnalyzed: queue.length,
        reorderOccurred: hasOrderChanged
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Architect error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse LLM response' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze queue. Please try again.' },
      { status: 500 }
    )
  }
}

function reorderQueue(
  queue: ArchitectRequest['queue'],
  analysis: GPTAnalysisResponse
): QueueItem[] {
  const { items, suggested_order } = analysis

  // Create a map of item metadata from GPT analysis
  const metadataMap = new Map(
    items?.map((item) => [item.id, item]) || []
  )

  // Validate suggested_order contains all IDs
  const queueIds = new Set(queue.map(q => q.id))
  const validOrder = suggested_order?.filter(id => queueIds.has(id)) || []

  // If GPT returned invalid order, keep original
  if (validOrder.length !== queue.length) {
    console.warn('GPT returned invalid order, keeping original')
    return queue.map((item, index) => ({
      ...item,
      status: 'queued' as const,
      rawContent: item.header,
      createdAt: Date.now(),
      category: metadataMap.get(item.id)?.category || 'General',
      complexityScore: metadataMap.get(item.id)?.complexity_score || 5,
      sequenceOrder: index
    }))
  }

  // Reorder based on suggested_order
  return validOrder.map((id, index) => {
    const original = queue.find(q => q.id === id)!
    const metadata = metadataMap.get(id)

    return {
      ...original,
      status: 'queued' as const,
      rawContent: original.header,
      createdAt: Date.now(),
      category: metadata?.category || 'General',
      complexityScore: metadata?.complexity_score || 5,
      sequenceOrder: index
    }
  })
}

function checkOrderChanged(
  original: ArchitectRequest['queue'],
  reordered: QueueItem[]
): boolean {
  return original.some((item, index) => item.id !== reordered[index]?.id)
}

function generateMockResponse(queue: ArchitectRequest['queue']): ArchitectResponse {
  // Mock response for development without API key
  // Simulates basic complexity-based ordering
  const mockQueue = queue.map((item, index) => ({
    ...item,
    status: 'queued' as const,
    rawContent: item.header,
    createdAt: Date.now(),
    category: 'General',
    complexityScore: 5,
    sequenceOrder: index
  }))

  return {
    reorderedQueue: mockQueue,
    reasoning: 'Mock mode - queue unchanged',
    analysisMetadata: { itemsAnalyzed: queue.length, reorderOccurred: false }
  }
}
