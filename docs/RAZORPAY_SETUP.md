# Razorpay Payment Setup Guide

This guide walks you through setting up Razorpay payments for Focus First from scratch.

## Overview

Focus First uses Razorpay Subscriptions for the Pro tier. The integration handles:
- Monthly recurring payments
- Automatic subscription lifecycle management via webhooks
- Tier upgrades/downgrades based on payment status

## Step 1: Create a Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click **Sign Up**
3. Enter your email and create a password
4. Verify your email
5. Complete the basic business information form

> **Note**: You can start in **Test Mode** without completing full KYC. This lets you test the integration with test cards before going live.

## Step 2: Get Your API Keys

1. Log into the [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Make sure you're in **Test Mode** (toggle in the top-left)
3. Go to **Settings** → **API Keys**
4. Click **Generate Test Key**
5. Copy both:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (only shown once - save it!)

Add these to your `.env.local`:

```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> **Important**: `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` should have the same value. The `NEXT_PUBLIC_` version is exposed to the browser for the checkout widget.

## Step 3: Create a Subscription Plan

1. In the Razorpay Dashboard, go to **Subscriptions** → **Plans**
2. Click **+ Create Plan**
3. Fill in the plan details:
   - **Plan Name**: `Focus First Pro` (or your preferred name)
   - **Description**: `Unlimited summarizations, curriculum architect, and more`
   - **Billing Amount**: Your price (e.g., `299` for ₹299)
   - **Billing Frequency**: `Monthly`
   - **Billing Cycles**: Leave empty for unlimited recurring
4. Click **Create Plan**
5. Copy the **Plan ID** (starts with `plan_`)

Add to your `.env.local`:

```bash
RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxx
```

## Step 4: Set Up Webhooks

Webhooks notify your app when payment events occur (subscription activated, payment failed, cancelled, etc.).

### 4.1 Get Your Webhook URL

Your webhook endpoint is:
```
https://your-domain.com/api/razorpay/webhook
```

For local development, you'll need a tunnel. Use one of these:

**Option A: ngrok (recommended)**
```bash
# Install ngrok
brew install ngrok  # or download from ngrok.com

# Start tunnel
ngrok http 3000
```
Copy the `https://xxxx.ngrok.io` URL.

**Option B: localtunnel**
```bash
npx localtunnel --port 3000
```

### 4.2 Configure Webhook in Razorpay

1. Go to **Settings** → **Webhooks**
2. Click **+ Add New Webhook**
3. Enter your webhook URL:
   - Production: `https://your-domain.com/api/razorpay/webhook`
   - Local dev: `https://xxxx.ngrok.io/api/razorpay/webhook`
4. Select these events:
   - `subscription.authenticated`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.pending`
   - `subscription.halted`
   - `subscription.cancelled`
   - `subscription.completed`
5. Set a **Secret** (generate a random string or let Razorpay generate one)
6. Click **Create Webhook**
7. Copy the webhook secret

Add to your `.env.local`:

```bash
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Step 5: Complete Your Environment Variables

Your final `.env.local` should include:

```bash
# Razorpay (required for payments)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

## Step 6: Test the Integration

### Test Cards

Use these test card numbers in Test Mode:

| Card Number | Description |
|------------|-------------|
| `4111 1111 1111 1111` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `5267 3181 8797 5449` | Mastercard success |

For all test cards:
- **Expiry**: Any future date (e.g., `12/25`)
- **CVV**: Any 3 digits (e.g., `123`)
- **Name**: Any name

### Testing Flow

1. Start your dev server: `npm run dev`
2. Sign in to your app
3. Trigger the paywall (use 3 free summarizations)
4. Click upgrade and complete checkout with a test card
5. Check your Razorpay Dashboard → **Subscriptions** to see the new subscription
6. Check your Supabase `user_subscriptions` table for the updated tier

### Testing Webhooks Locally

1. Start ngrok: `ngrok http 3000`
2. Update webhook URL in Razorpay Dashboard to ngrok URL
3. Complete a test payment
4. Check your terminal for webhook logs

## Going Live

When ready for production:

1. Complete KYC verification in Razorpay Dashboard
2. Switch to **Live Mode** in the dashboard
3. Generate **Live API Keys** (Settings → API Keys)
4. Create a new **Live Plan** (plans don't transfer from test)
5. Set up a new **Live Webhook** with your production URL
6. Update your production environment variables with live keys

```bash
# Production .env (use live keys)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
RAZORPAY_PLAN_ID=plan_live_xxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
```

## Troubleshooting

### "Razorpay credentials not configured"
- Check that all env vars are set in `.env.local`
- Restart your dev server after adding env vars

### Webhook not receiving events
- Verify the webhook URL is accessible (try opening it in browser - should return 401)
- Check that all required events are selected in Razorpay Dashboard
- For local dev, ensure ngrok tunnel is running

### Subscription not updating in database
- Check Supabase `user_subscriptions` table exists
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (webhooks bypass RLS)
- Check server logs for webhook errors

### Payment succeeds but tier doesn't upgrade
- Webhooks might be delayed - wait a few seconds
- Check webhook logs in Razorpay Dashboard → Webhooks → Recent Deliveries
- Verify the `supabase_user_id` is being passed in subscription notes

## Reference

### Webhook Events Handled

| Event | Description | Action |
|-------|-------------|--------|
| `subscription.authenticated` | Payment authorized | Store subscription ID |
| `subscription.activated` | First payment success | Upgrade to Pro |
| `subscription.charged` | Recurring payment success | Extend subscription |
| `subscription.pending` | Payment pending | Mark as pending |
| `subscription.halted` | Multiple payment failures | Mark as halted |
| `subscription.cancelled` | User cancelled | Downgrade to Free |
| `subscription.completed` | All cycles complete | Downgrade to Free |

### Tier Limits

| Feature | Free | Pro |
|---------|------|-----|
| Summarizations/day | 3 | Unlimited |
| Items/day | 3 | Unlimited |
| Curriculum Architect | No | Yes |

### Files Reference

- `lib/razorpay/server.ts` - Server SDK + tier config
- `lib/razorpay/client.ts` - Browser checkout loader
- `app/api/razorpay/create-subscription/route.ts` - Creates subscriptions
- `app/api/razorpay/webhook/route.ts` - Handles payment events
- `components/PaywallModal.tsx` - Upgrade UI
