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
