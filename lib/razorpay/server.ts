import Razorpay from 'razorpay'

let razorpay: Razorpay | null = null

export const getRazorpayServer = () => {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured')
    }

    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }
  return razorpay
}

// Plan ID for Pro subscription (created in Razorpay Dashboard)
export const RAZORPAY_PLAN_ID = process.env.RAZORPAY_PLAN_ID || ''

// Tier limits configuration
export const TIER_LIMITS = {
  free: {
    summarizationsPerDay: 3,
    itemsPerDay: 3,
    hasArchitect: false,
  },
  pro: {
    summarizationsPerDay: Infinity,
    itemsPerDay: Infinity,
    hasArchitect: true,
  },
} as const

export type SubscriptionTier = keyof typeof TIER_LIMITS
