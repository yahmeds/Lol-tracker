# Lol Tracker
 
> Real-time League of Legends activity tracker built for esport coaches.
 
Lol Tracker monitors a player's in-game activity around the clock, logs every game session to a persistent database, and surfaces daily and historical stats through a clean mobile-first interface installable as a PWA on Android.
 
---

## Features
 
- **Live game detection** — polls the Riot Games API every x minutes via an external cron service
- **Push notifications** — browser notifications fire the moment a game is detected
- **Queue phase tracking** — distinguishes between champion select, loading screen, and in-game states
- **Daily board** — games played and estimated playtime for any selected day, with live indicators for ongoing sessions
- **Interactive calendar** — monthly view with color-coded activity dots, click any day to inspect its sessions
- **30-day activity chart** — bar chart with per-day game counts, peak day highlight, and summary stats
- **Persistent storage** — all game data written to Supabase (PostgreSQL)
- **Cross-device sync** — settings saved to Supabase mean any device opening the app picks up the current configuration automatically
- **PWA** — installable on Android via Chrome, runs fullscreen with no browser chrome
---

## Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Styling | CSS Modules with design tokens |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| CI/CD | GitHub Actions → Vercel CLI |
| Cron | cron-job.org (every 5 minutes) |
| Data source | Riot Games API v5 |
| PWA | vite-plugin-pwa + Workbox |
 
---

## Getting Started
 
### Prerequisites
 
- Node.js 20+
- A [Riot Games developer account](https://developer.riotgames.com) (free API key)
- A [Supabase](https://supabase.com) project (free tier)
- A [Vercel](https://vercel.com) account
- A [cron-job.org](https://cron-job.org) account (free)

### Local setup
 
```bash
git clone https://github.com/YOUR_USERNAME/coachscan.git
cd coachscan
npm install
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Database setup
 
In your Supabase dashboard → SQL Editor → New query, paste the contents of `supabase-schema.sql` and run it. This creates two tables:
 
- `games` — one row per detected game session
- `config` — single-row config read by the server-side cron

### Environment variables
 
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never expose to client) |
| `CRON_SECRET` | Shared secret to authenticate cron requests to `/api/poll` |
 
### Android installation
 
Open the deployed URL in Chrome on Android → menu → *Add to Home Screen*. The app runs in standalone mode with no browser UI.
 
---

## How the Cron Works
 
```
cron-job.org (every 5 min)
        │
        ▼
GET /api/poll  ──► reads config table (player + API key)
        │
        ▼
Riot Spectator API  ──► player in game?
        │
   ┌────┴────┐
  YES        NO
   │          │
   ▼          ▼
insert     close any
new game   open game
in games   + calc duration
table
```
 
---

## Development Workflow
 
```bash
npm run dev      # local dev server with HMR
npm run build    # production build
npm run preview  # preview production build locally
```
 
Feature branches trigger preview deployments on Vercel automatically. Merging to `main` deploys to production.
 
---

## Known Limitations
 
- Riot development API keys expire every 24 hours. For permanent use, request a personal API key through the Riot developer portal.
- cron-job.org free tier runs every x minutes at best — games shorter than x minutes could theoretically be missed, though this is rare in practice.
- Game duration is estimated from `started_at` to the moment the cron first detects the session has ended, not from Riot's own match data.
