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
