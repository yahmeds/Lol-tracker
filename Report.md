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
