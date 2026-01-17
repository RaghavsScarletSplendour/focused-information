import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS, SubscriptionTier } from '@/lib/razorpay/server'

export interface UserSubscription {
  tier: SubscriptionTier
  status: string
  razorpayCustomerId: string | null
  razorpaySubscriptionId: string | null
  currentPeriodEnd: Date | null
}

export interface UsageStatus {
  allowed: boolean
  used: number
  limit: number
  remaining: number
}

/**
 * Get user's subscription details
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = await createClient()

  // Return free tier if Supabase is not configured
  if (!supabase) {
    return {
      tier: 'free',
      status: 'active',
      razorpayCustomerId: null,
      razorpaySubscriptionId: null,
      currentPeriodEnd: null,
    }
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    // Default to free tier if no subscription found
    return {
      tier: 'free',
      status: 'active',
      razorpayCustomerId: null,
      razorpaySubscriptionId: null,
      currentPeriodEnd: null,
    }
  }

  return {
    tier: (data.tier as SubscriptionTier) || 'free',
    status: data.status || 'active',
    razorpayCustomerId: data.razorpay_customer_id,
    razorpaySubscriptionId: data.razorpay_subscription_id,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
  }
}

/**
 * Get or create today's usage record
 */
async function getOrCreateDailyUsage(userId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Return default if Supabase is not configured
  if (!supabase) {
    return { summarizations: 0, items_created: 0 }
  }

  // Try to get existing record
  const { data: existing } = await supabase
    .from('daily_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (existing) {
    return existing
  }

  // Create new record for today
  const { data: created, error } = await supabase
    .from('daily_usage')
    .insert({ user_id: userId, date: today })
    .select()
    .single()

  if (error) {
    // Handle race condition - record might have been created
    const { data: retry } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    return retry || { summarizations: 0, items_created: 0 }
  }

  return created
}

/**
 * Check if user can perform an action based on their tier and usage
 */
export async function checkUsageLimit(
  userId: string,
  action: 'summarize' | 'create_item'
): Promise<UsageStatus> {
  const subscription = await getUserSubscription(userId)
  const limits = TIER_LIMITS[subscription.tier]
  const usage = await getOrCreateDailyUsage(userId)

  let used: number
  let limit: number

  if (action === 'summarize') {
    used = usage?.summarizations || 0
    limit = limits.summarizationsPerDay
  } else {
    used = usage?.items_created || 0
    limit = limits.itemsPerDay
  }

  const remaining = Math.max(0, limit - used)
  const allowed = limit === Infinity || used < limit

  return { allowed, used, limit, remaining }
}

/**
 * Check if user has access to a pro feature
 */
export async function checkProFeature(
  userId: string,
  feature: 'architect'
): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  const limits = TIER_LIMITS[subscription.tier]

  if (feature === 'architect') {
    return limits.hasArchitect
  }
  return false
}

/**
 * Increment usage counter after successful action
 */
export async function incrementUsage(
  userId: string,
  action: 'summarize' | 'create_item'
): Promise<void> {
  const supabase = await createClient()

  // Skip if Supabase is not configured
  if (!supabase) {
    return
  }

  const today = new Date().toISOString().split('T')[0]

  // Ensure record exists
  await getOrCreateDailyUsage(userId)

  // Increment the appropriate counter
  const column = action === 'summarize' ? 'summarizations' : 'items_created'

  await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_date: today,
    p_column: column,
  })
}

/**
 * Get user's current usage for display
 */
export async function getCurrentUsage(userId: string) {
  const subscription = await getUserSubscription(userId)
  const limits = TIER_LIMITS[subscription.tier]
  const usage = await getOrCreateDailyUsage(userId)

  return {
    tier: subscription.tier,
    status: subscription.status,
    summarizations: {
      used: usage?.summarizations || 0,
      limit: limits.summarizationsPerDay,
    },
    items: {
      used: usage?.items_created || 0,
      limit: limits.itemsPerDay,
    },
    features: {
      architect: limits.hasArchitect,
    },
  }
}
