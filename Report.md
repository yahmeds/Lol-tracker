# TrackLol — Project Report
 
**Project type:** Personal full-stack web application  
**Stack:** React · Vite · Supabase · Vercel · Riot Games API  
 
---

## 1. Project Overview
 
TrackLol is a real-time League of Legends activity tracker built for an esport coach who needed to monitor a specific player's gaming sessions without being present. The core requirement was simple: get notified when the player starts a game, and have access to historical session data.
 
The project evolved significantly during development — starting as a single HTML file and ending as a full-stack React application with a server-side polling system, persistent database, CI/CD pipeline, and PWA support.
 
---

## 2. Initial Prototype
 
The first version was a **single self-contained HTML file** served via Netlify Drop. It used:
 
- Vanilla JavaScript with `setInterval` for polling
- The Riot Games Spectator API to detect active games
- `localStorage` for all persistence
- The Web Notifications API for browser alerts
- A basic daily counter that reset at midnight
This version worked but had a critical limitation: **polling only ran while the browser tab was open**. Closing the tab meant missing games entirely.
 
---

## 3. Migration to React + Vite
 
The project was restructured into a proper React application to support component reuse, maintainability, and future feature growth.
 
**Architecture decisions made:**
 
- **CSS Modules** over a utility framework — keeps styles scoped and colocated with components
- **Custom hooks** (`useTracker`, `useSettings`) to isolate logic from UI
- **Supabase** as the database — free PostgreSQL tier, JavaScript SDK, built-in Row Level Security
- **Vercel** for hosting — zero-config React deployments, serverless function support
- **vite-plugin-pwa** for PWA generation — manifest + service worker handled automatically
**Project structure:**
 
```
src/
├── components/    # UI components, each with its own CSS Module
├── hooks/         # useTracker (polling), useSettings (config persistence)
├── lib/           # riot.js (API client), supabase.js (DB operations)
└── styles/        # global.css with CSS custom properties
```
 
---

## 5. CI/CD Pipeline
 
**GitHub Actions → Vercel CLI**
 
The deployment workflow (`deploy.yml`) runs on every push to `main`:
 
1. Checkout code
2. Setup Node.js 24
3. `npm ci --legacy-peer-deps`
4. `vercel pull` — fetches environment variables from Vercel
5. `vercel build --prod` — builds the project in Vercel's environment
6. `vercel deploy --prebuilt --prod` — ships the pre-built output
Several issues were encountered and resolved during setup:
 
- `amondnet/vercel-action@v25` used Vercel CLI v25, which was rejected by Vercel's API requiring v47+. Fixed by replacing the action with direct CLI invocation.
- `vite-plugin-pwa` had a peer dependency conflict with Vite 8. Fixed by adding `legacy-peer-deps=true` to `.npmrc`.
- `package-lock.json` was missing from the repo, causing `npm ci` to fail on the runner. Fixed by committing the lockfile.
**Secrets required:**
 
| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Authenticate Vercel CLI |
| `VERCEL_ORG_ID` | Target organization |
| `VERCEL_PROJECT_ID` | Target project |
| `VITE_SUPABASE_URL` | Injected at build time |
| `VITE_SUPABASE_ANON_KEY` | Injected at build time |
| `SUPABASE_SERVICE_ROLE_KEY` | Used server-side in `/api/poll` |
| `CRON_SECRET` | Authenticates cron requests |
| `VERCEL_APP_URL` | Base URL for cron caller |
 
---
 
## 6. Server-Side Polling
 
### The Problem
 
Vercel hosts static files and serverless functions — it does not run persistent processes. The React app's polling loop runs in the browser, so closing the tab stops all monitoring.
 
### First Attempt: Vercel Cron Jobs
 
A `vercel.json` cron was configured to call `/api/poll` every minute. This was rejected immediately — **Vercel's free (Hobby) plan limits cron jobs to once per day**. Anything more frequent requires the Pro plan ($20/month).
 
### Second Attempt: GitHub Actions Scheduler
 
A `cron.yml` workflow was added with `schedule: '* * * * *'`. GitHub Actions does support cron scheduling, but in practice the free tier throttles scheduled workflows heavily — executions happened roughly **once per hour**, sometimes with gaps of 4+ hours. Completely unusable for detecting 30-minute game sessions.
 
### Final Solution: cron-job.org
 
An external cron service ([cron-job.org](https://cron-job.org)) was configured to call the Vercel endpoint every x minutes. This service is free and reliable, with execution logs available in the dashboard.
 
The request includes an `Authorization: Bearer <secret>` header. The `/api/poll` serverless function validates this header against `process.env.CRON_SECRET` before proceeding.
 
