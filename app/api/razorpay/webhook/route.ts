import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Use service role client for webhook (bypasses RLS)
const getServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase service role not configured')
  }

  return createClient(url, serviceKey)
}

// Verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify signature
    const isValid = verifyWebhookSignature(body, signature, webhookSecret)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const eventType = event.event
    const payload = event.payload

    console.log('Razorpay webhook received:', eventType)

    const supabase = getServiceClient()

    switch (eventType) {
      case 'subscription.authenticated': {
        // Subscription created and authenticated, awaiting first payment
        const subscriptionId = payload.subscription?.entity?.id
        const customerId = payload.subscription?.entity?.customer_id
        const userId = payload.subscription?.entity?.notes?.supabase_user_id

        if (userId) {
          await supabase
            .from('user_subscriptions')
            .update({
              razorpay_subscription_id: subscriptionId,
              razorpay_customer_id: customerId,
              status: 'authenticated',
            })
            .eq('user_id', userId)
        }
        break
      }

      case 'subscription.activated': {
        // First payment successful, subscription is now active
        const subscriptionId = payload.subscription?.entity?.id
        const userId = payload.subscription?.entity?.notes?.supabase_user_id
        const currentEnd = payload.subscription?.entity?.current_end

        if (userId) {
          await supabase
            .from('user_subscriptions')
            .update({
              tier: 'pro',
              status: 'active',
              current_period_end: currentEnd ? new Date(currentEnd * 1000).toISOString() : null,
            })
            .eq('user_id', userId)

          console.log(`User ${userId} upgraded to pro`)
        }
        break
      }

      case 'subscription.charged': {
        // Recurring payment successful
        const userId = payload.subscription?.entity?.notes?.supabase_user_id
        const currentEnd = payload.subscription?.entity?.current_end

        if (userId) {
          await supabase
            .from('user_subscriptions')
            .update({
              tier: 'pro',
              status: 'active',
              current_period_end: currentEnd ? new Date(currentEnd * 1000).toISOString() : null,
            })
            .eq('user_id', userId)
        }
        break
      }

      case 'subscription.pending': {
        // Payment pending
        const userId = payload.subscription?.entity?.notes?.supabase_user_id

        if (userId) {
          await supabase
            .from('user_subscriptions')
            .update({ status: 'pending' })
            .eq('user_id', userId)
        }
        break
      }

      case 'subscription.halted': {
        // Payment failed multiple times
        const userId = payload.subscription?.entity?.notes?.supabase_user_id

        if (userId) {
          await supabase
            .from('user_subscriptions')
            .update({ status: 'halted' })
            .eq('user_id', userId)
        }
        break
      }

      case 'subscription.cancelled': {
        // Subscription cancelled
        const userId = payload.subscription?.entity?.notes?.supabase_user_id

        if (userId) {
          await supabase
            .from('user_subscriptions')
            .update({
              tier: 'free',
              status: 'cancelled',
            })
            .eq('user_id', userId)

          console.log(`User ${userId} downgraded to free`)
        }
        break
      }

      case 'subscription.completed': {
        // Subscription completed all cycles
        const userId = payload.subscription?.entity?.notes?.supabase_user_id

        if (userId) {
          await supabase
            .from('user_subscriptions')
            .update({
              tier: 'free',
              status: 'completed',
            })
            .eq('user_id', userId)
        }
        break
      }

      default:
        console.log('Unhandled webhook event:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
