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

*Add new features below this line.*
