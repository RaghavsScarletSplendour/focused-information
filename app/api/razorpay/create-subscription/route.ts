import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpayServer, RAZORPAY_PLAN_ID } from '@/lib/razorpay/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!RAZORPAY_PLAN_ID) {
      return NextResponse.json(
        { error: 'Razorpay plan not configured' },
        { status: 500 }
      )
    }

    const razorpay = getRazorpayServer()

    // Create subscription with notify_info for customer communication
    // Note: customer_id is populated automatically after authorization
    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: RAZORPAY_PLAN_ID,
      total_count: 120, // 10 years of monthly billing
      customer_notify: 1,
      notes: {
        supabase_user_id: user.id,
      },
      notify_info: {
        notify_email: user.email || undefined,
      },
    })

    // Ensure user subscription record exists and save subscription ID
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        razorpay_subscription_id: razorpaySubscription.id,
        tier: 'free',
        status: 'created',
      }, {
        onConflict: 'user_id',
      })

    return NextResponse.json({
      subscriptionId: razorpaySubscription.id,
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
