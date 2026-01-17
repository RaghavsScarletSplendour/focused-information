# Focus First

A Next.js learning app that helps users process AI/ML news one item at a time. Features AI-powered summarization (GPT-4o-mini), curriculum optimization, and a freemium model with Razorpay payments and Supabase backend.

**Stack**: Next.js 14, React 18, TypeScript, Supabase, OpenAI, Razorpay, Tailwind CSS, Framer Motion

**Structure**:
- `app/` - Next.js App Router (pages + API routes)
- `components/` - React components (modals, forms, cards)
- `hooks/` - Custom hooks (useQueue, useArchive, useSubscription)
- `lib/` - Shared utilities (supabase, razorpay, subscription logic)
- `context/` - AuthContext for global auth state

For detailed architecture, see [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).

## Key Patterns

- **Dual persistence**: localStorage (anonymous) / Supabase (authenticated) with auto-migration
- **Pro feature gating**: Server-side checks in `lib/subscription.ts`, 403 triggers paywall
- **Debounced architect**: 500ms debounce on queue changes for curriculum optimization

## Common Tasks

- Add API endpoint: `app/api/[name]/route.ts`, use `createClient()` from `lib/supabase/server.ts`
- Add component: Create in `components/`, wire up in `app/app/page.tsx`
- Modify subscription: Tier limits in `lib/razorpay/server.ts`, logic in `lib/subscription.ts`
