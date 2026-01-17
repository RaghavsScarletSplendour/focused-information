declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export interface RazorpayOptions {
  key: string
  subscription_id: string
  name: string
  description?: string
  image?: string
  handler: (response: RazorpayResponse) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

export interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

export interface RazorpayInstance {
  open: () => void
  close: () => void
}

let razorpayScriptLoaded = false

export const loadRazorpay = (): Promise<typeof window.Razorpay> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Razorpay can only be loaded in browser'))
      return
    }

    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }

    if (razorpayScriptLoaded) {
      // Script is loading, wait for it
      const checkInterval = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(checkInterval)
          resolve(window.Razorpay)
        }
      }, 100)
      return
    }

    razorpayScriptLoaded = true
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true

    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay)
      } else {
        reject(new Error('Razorpay failed to load'))
      }
    }

    script.onerror = () => {
      razorpayScriptLoaded = false
      reject(new Error('Failed to load Razorpay script'))
    }

    document.body.appendChild(script)
  })
}

export const openRazorpayCheckout = async (
  subscriptionId: string,
  userEmail?: string,
  userName?: string,
  onSuccess?: (response: RazorpayResponse) => void,
  onDismiss?: () => void
) => {
  const Razorpay = await loadRazorpay()
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

  if (!keyId) {
    throw new Error('Razorpay key not configured')
  }

  const options: RazorpayOptions = {
    key: keyId,
    subscription_id: subscriptionId,
    name: 'Focus First',
    description: 'Pro Subscription - Unlimited Learning',
    handler: (response) => {
      onSuccess?.(response)
    },
    prefill: {
      email: userEmail,
      name: userName,
    },
    theme: {
      color: '#000000',
    },
    modal: {
      ondismiss: onDismiss,
    },
  }

  const razorpayInstance = new Razorpay(options)
  razorpayInstance.open()

  return razorpayInstance
}
