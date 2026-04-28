import { useState, useEffect } from 'react'
import { fetchGamesLast30Days } from '../lib/supabase'
import { parsePlayer, playerSlug } from '../lib/riot'

const LOCAL_GAMES_KEY = 'coachscan_games'

function loadLocalGames() {
  try { return JSON.parse(localStorage.getItem(LOCAL_GAMES_KEY) || '[]') }
  catch { return [] }
}

function saveLocalGames(games) {
  localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(games))
}

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useTracker(settings, isConfigured) {
  const [allGames, setAllGames] = useState([])
  const [status, setStatus] = useState('idle')
  const [lastRefresh, setLastRefresh] = useState(null)

  // Load games from Supabase on mount and every 2 minutes
  useEffect(() => {
    if (!isConfigured || !settings.player) {
      setStatus('idle')
      return
    }

    const slug = playerSlug(settings.player)

    async function refresh() {
      try {
        const remote = await fetchGamesLast30Days(slug)
        if (remote.length > 0) {
          setAllGames(remote)
          saveLocalGames(remote)
        } else {
          setAllGames(loadLocalGames())
        }

        // Detect if player is currently in game (open game with no ended_at)
        const openGame = remote.find(g => !g.ended_at)
        setStatus(openGame ? 'ingame' : 'watching')
        setLastRefresh(new Date())
      } catch {
        setAllGames(loadLocalGames())
        setStatus('watching')
      }
    }

    refresh()
    const interval = setInterval(refresh, 2 * 60 * 1000) // refresh every 2 min
    return () => clearInterval(interval)
  }, [settings.player, isConfigured])

  // Derived daily stats
  const today = todayStr()
  const todayGames = allGames.filter(g => g.started_at?.slice(0, 10) === today)
  const totalMinToday = todayGames.reduce((acc, g) => acc + (g.duration_min || 0), 0)

  // Current game (open session)
  const currentGame = allGames.find(g => !g.ended_at) || null

  return {
    status,
    errorMsg: '',
    currentGame,
    allGames,
    todayGames,
    totalMinToday,
    lastChecked: lastRefresh,
  }
}

export function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}