import { useState, useEffect } from 'react'
import { fetchAllGames } from '../lib/supabase'
import { parsePlayer, playerSlug } from '../lib/riot'

const LOCAL_GAMES_KEY_PREFIX = 'coachscan_games_'

function loadLocalGames(slug) {
  try { return JSON.parse(localStorage.getItem(LOCAL_GAMES_KEY_PREFIX + slug) || '[]') }
  catch { return [] }
}

function saveLocalGames(slug, games) {
  localStorage.setItem(LOCAL_GAMES_KEY_PREFIX + slug, JSON.stringify(games))
}

function coachingDateKey(startedAt) {
  const d = new Date(startedAt)
  if (d.getHours() < 8) d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayStr() {
  return coachingDateKey(new Date())
}

export function useTracker(settings, isConfigured) {
  const [allGames, setAllGames] = useState([])
  const [status, setStatus] = useState('idle')
  const [lastRefresh, setLastRefresh] = useState(null)

  // Load games from Supabase on mount and every 2 minutes
  useEffect(() => {
    if (!isConfigured || !settings.currentPlayer) {
      setStatus('idle')
      return
    }

    const slug = playerSlug(settings.currentPlayer)

    // Reset to this player's cached games immediately so we don't show the
    // previous player's data while the fetch is in flight.
    setAllGames(loadLocalGames(slug))

    async function refresh() {
      try {
        const remote = await fetchAllGames(slug)
        setAllGames(remote)
        saveLocalGames(slug, remote)

        // Detect if player is currently in game (open game with no ended_at)
        const THREE_HOURS = 3 * 60 * 60 * 1000
        const openGame = remote.find(g =>
          !g.ended_at && (Date.now() - new Date(g.started_at).getTime()) < THREE_HOURS
        )
        setStatus(openGame ? 'ingame' : 'watching')
        setLastRefresh(new Date())
      } catch {
        setAllGames(loadLocalGames(slug))
        setStatus('watching')
      }
    }

    refresh()
    const interval = setInterval(refresh, 2 * 60 * 1000) // refresh every 2 min
    return () => clearInterval(interval)
  }, [settings.currentPlayer, isConfigured])

  // Derived daily stats
  const today = todayStr()
  const todayGames = allGames.filter(g => coachingDateKey(g.started_at) === today)
  const totalMinToday = todayGames.reduce((acc, g) => acc + (g.duration_min || 0), 0)

  // Current game (open session)
const THREE_HOURS = 3 * 60 * 60 * 1000
const currentGame = allGames.find(g =>
  !g.ended_at && (Date.now() - new Date(g.started_at).getTime()) < THREE_HOURS
) || null

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