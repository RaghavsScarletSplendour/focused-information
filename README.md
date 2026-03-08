# Focus-First Learning

> **Stop collecting signals. Start learning them.**

A Next.js learning app that helps you process AI/ML news one item at a time. Turn your endless bookmark chaos into a focused, AI-optimized learning queue.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

---

## The Problem

You have 847 AI links saved across 12 apps. You've learned from exactly **0** of them.

The issue isn't finding good content — it's that you're addicted to **collecting signals**, not **processing** them. Every time you see a fire tweet about transformers or a new paper, you save it. Then you never look at it again.

Sound familiar?

## The Solution

Focus-First does **3 things**:

1. **Strips the hype** from any URL (papers, tweets, repos)
2. **Creates 2-line learning cards** using GPT-4o-mini
3. **Shows ONE card at a time** (no infinite scroll, no choice paralysis)

The AI also **reorders your queue** — foundational concepts first, then the things that build on them. You don't decide the order. The architect does.

---

## Features

### ✨ Core
- **AI-Powered Summarization** — Paste any URL, get a distilled learning card
- **One-at-a-time Queue** — No distractions. One card. Learn it or skip it.
- **Smart Curriculum** — AI reorders your queue (debounced 500ms for optimization)
- **Dual Persistence** — localStorage (anonymous) / Supabase (authenticated) with auto-migration

### 🔐 Pro Features (Freemium Model)
- Unlimited queue size (Free: 10 items)
- Archive (Free: limited)
- Razorpay payment integration
- Server-side subscription checks (`lib/subscription.ts`)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.6 |
| **UI** | React 18, Tailwind CSS, Framer Motion |
| **Backend** | Supabase (Auth + Postgres) |
| **AI** | OpenAI GPT-4o-mini |
| **Payments** | Razorpay |
| **Deployment** | Vercel (recommended) |

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account
- OpenAI API key
- Razorpay account (for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/RaghavsScarletSplendour/focused-information.git
cd focused-information

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see Configuration below)

# Run database migrations
# (see supabase/ folder for SQL files)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Configuration

Create a `.env.local` file with the following:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Project Structure

```
focused-information/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (summarize, curriculum, payments)
│   ├── app/               # Main app page
│   ├── auth/              # Auth pages (sign-in, sign-up, callback)
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── LearningCard.tsx   # Main card UI
│   ├── QueueSidebar.tsx   # Queue management
│   ├── PaywallModal.tsx   # Pro upgrade modal
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── useQueue.ts        # Queue state management
│   ├── useArchive.ts      # Archive state management
│   └── useSubscription.ts # Subscription logic
├── lib/                   # Shared utilities
│   ├── supabase/          # Supabase client (server + browser)
│   ├── razorpay/          # Payment integration
│   └── subscription.ts    # Subscription tier logic
├── context/               # React Context providers
│   └── AuthContext.tsx    # Global auth state
├── types/                 # TypeScript type definitions
├── supabase/              # Database migrations (SQL)
└── docs/                  # Documentation
    └── CODEBASE_MAP.md    # Detailed architecture

```

---

## Key Patterns

### Dual Persistence
- **Anonymous users** → localStorage
- **Authenticated users** → Supabase
- Auto-migration on sign-in (localStorage → Supabase)

### Pro Feature Gating
- Server-side checks in `lib/subscription.ts`
- 403 responses trigger `PaywallModal`
- Tier limits defined in `lib/razorpay/server.ts`

### Debounced Curriculum
- 500ms debounce on queue changes
- AI reorders queue based on conceptual dependencies
- Optimization endpoint: `/api/curriculum`

---

## Common Tasks

### Add a New API Endpoint
```typescript
// app/api/[name]/route.ts
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  // Your logic here
}
```

### Add a New Component
1. Create in `components/`
2. Wire up in `app/app/page.tsx`
3. Use TypeScript types from `types/`

### Modify Subscription Tiers
- Tier limits: `lib/razorpay/server.ts`
- Logic: `lib/subscription.ts`
- UI: `components/PaywallModal.tsx`

---

## Marketing Strategy

See [MARKETING_STRATEGY.md](MARKETING_STRATEGY.md) for:
- X (Twitter) content pillars
- Reddit engagement tactics
- TikTok wildcard plays
- Viral thread templates

**Core Insight:** Your target users are already drowning. They know they're drowning. They just need someone to call it out and offer a rope.

---

## Architecture Deep Dive

For detailed codebase walkthrough, see [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).

For development notes and patterns, see [CLAUDE.md](CLAUDE.md).

---

## Scripts

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (from `.env.local`)
4. Deploy

### Environment Variables (Production)
Make sure to set all variables from `.env.local` in your Vercel project settings.

---

## Contributing

This is a personal project by Raghav Bajoria. Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Private repository. All rights reserved.

---

## Contact

**Raghav Bajoria**
- GitHub: [@RaghavsScarletSplendour](https://github.com/RaghavsScarletSplendour)
- Email: raghavbajoria123@gmail.com

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [OpenAI](https://openai.com/)
- Backend by [Supabase](https://supabase.com/)
- Payments by [Razorpay](https://razorpay.com/)

---

**Remember:** Stop collecting signals. Start learning them. ⚡
