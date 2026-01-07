# Focus-First: Feature IDR

A living document tracking features for the Focus-First AI Learning app.

---

## Feature 1: The "Signal" Bookmarklet (The Friction-Killer)

**Status:** Proposed

### Overview

A bookmarklet is a tiny piece of JavaScript saved as a browser bookmark. When browsing X, research papers, or any page, clicking it automatically "dumps" that page into the app without leaving the site.

### Why It's Worth It

Turns "Dumping" from a 30-second chore into a 1-second reflex.

### Technical Approach

**The Logic:**
- Grabs `window.location.href` and `document.title`
- Sends them to the `/api/summarize` endpoint
- Optionally opens the app in a new tab or shows a toast confirmation

**Bookmarklet Code (Draft):**
```javascript
javascript:(function(){
  const API_URL = 'YOUR_APP_URL/api/summarize';
  const url = window.location.href;
  const title = document.title;
  // POST to API or redirect to app with params
})();
```

### Open Questions

- [ ] Should the bookmarklet open the app, or just queue the item silently?
- [ ] How to handle authentication if the app requires it later?
- [ ] Should we provide visual feedback (toast/popup) on the source page?

---

## Feature 2: The "Archive" & Progress Log

**Status:** Proposed

### Overview

Once you click "Mark as Learned," the card disappears. But for your brain to feel like it's actually winning, you need a way to see what you've conquered.

A "History" view that is hidden by default. A simple list of headers and dates. Seeing a list of 20 "Learned" topics at the end of the week is the dopamine hit that keeps you using the app.

### Why It's Worth It

Provides the psychological reward loop that sustains long-term habit formation. Without visible progress, users lose motivation.

### Technical Approach

**UI:**
- Hidden by default (small "Archive" link or icon in corner)
- Simple list view: Header + Date learned
- No distractions—just the record of accomplishment

**Storage:**
- Already storing history in localStorage (`focus-first-history` key)
- Display last 50 items, sorted by most recent

**Components:**
- `ArchiveView.tsx` - List of learned items
- Toggle button to show/hide archive

### Open Questions

- [ ] Should archive be a separate route (`/archive`) or a modal/drawer?
- [ ] Include any stats (streak, weekly count, total learned)?
- [ ] Allow re-queuing items from archive for review?

---

## Feature 3: The "Daily Limit" (Mental Guardrail)

**Status:** Proposed

### Overview

If you set your limit to 3 things, the app should literally lock you out of the next card once you finish the 3rd one.

**The Message:** "You've reached your signal limit for today. Go build something with what you learned."

### Why It's Worth It

Prevents the app from becoming another infinite scroll. Enforces the "focus-first" philosophy at the system level, not just UI level.

### Technical Approach

**Onboarding:**
- First-time setup: "How many things can you realistically learn today?" (1-5 slider)
- Store preference in localStorage

**Daily Tracking:**
- Track `learnedToday` count with date stamp
- Reset count at midnight (or on first interaction of new day)

**Lockout UI:**
- When `learnedToday >= dailyLimit`:
  - Hide all cards and dump form
  - Show lockout message: "You've reached your signal limit for today."
  - Subtext: "Go build something with what you learned."
  - Optional: Show what you learned today as a mini-summary

**Data Model:**
```typescript
interface UserPreferences {
  dailyLimit: number // 1-5, default 3
  learnedToday: number
  lastLearnedDate: string // ISO date string
}
```

### Open Questions

- [ ] Allow users to change their limit mid-day?
- [ ] "Unlock anyway" escape hatch, or hard lockout?
- [ ] Reset at midnight local time, or 24 hours from first item?
- [ ] Show countdown to reset?

---

*Add new features below this line.*
