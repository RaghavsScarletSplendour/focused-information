import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUsage } from '@/lib/subscription'

export async function GET() {
  try {
    const supabase = await createClient()
    const user = supabase ? (await supabase.auth.getUser()).data.user : null

    if (!user) {
      // Return free tier defaults for unauthenticated users
      return NextResponse.json({
        tier: 'free',
        status: 'active',
        summarizations: {
          used: 0,
          limit: 3,
        },
        items: {
          used: 0,
          limit: 3,
        },
        features: {
          architect: false,
        },
        authenticated: false,
      })
    }

    const usage = await getCurrentUsage(user.id)

    return NextResponse.json({
      ...usage,
      authenticated: true,
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}
