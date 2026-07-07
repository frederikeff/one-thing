# One Thing

A tiny task app for a brain that hyperfocuses, scatters, and forgets. Built for Frederike, by
Frederike (with Claude). Sibling of [My Story](../personal-trust-respect).

## The idea

Notion holds lists; this holds *attention*. The whole app is one loop:

1. **Brain dump** (Tasks tab) — get everything out of your head, one line at a time. Nothing
   expires, nothing turns red.
2. **Pick ONE thing** (Now tab) — pull one or two tasks into Today. Then pick exactly one.
3. **A small timer** — "just 10 minutes." Starting is the win; you can stop anytime and the
   minutes still count.
4. **Time's up → bonus mode** — hyperfocus is welcome. The timer flips to counting bonus minutes
   instead of nagging.
5. **Break** — 3 minutes: drink water, stretch, look far away. Then back to it, or something else.
6. **Done → confetti** — mark it proud 😊 or EXTRA proud 🌟. It lands on the Wins wall forever.

**Where am I?** — the Tasks tab shows Today / Later / Done-today at a glance; the Wins tab shows
counters that only ever go up (things finished, focus minutes, times you showed up, proud moments).

## House rules (non-negotiable, shared with My Story)

- Nothing ever decreases, breaks, or expires. No streaks, no red badges, no guilt.
- Tasks marked "today" that don't happen just drift silently back to the pile at midnight.
- Stopping on purpose is a success and is celebrated as one.
- Data is local-first (IndexedDB on the device), with one-tap JSON backup/restore in More.

## Running it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build (dist/)
```

It's a PWA — deployed to any static host over HTTPS it installs to a phone home screen and works
offline. Timers survive closing the app: they're stored as timestamps, not countdowns.

## Stack

Vite + React, Dexie (IndexedDB), vite-plugin-pwa. No backend, no accounts.

## Roadmap ideas

- Gentle notification when a break ends
- "Body double" mode: a soft ambient presence while focusing
- Weekly "look what you did" recap composed from the wins wall
- Optional sync between devices
