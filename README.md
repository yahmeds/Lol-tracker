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
