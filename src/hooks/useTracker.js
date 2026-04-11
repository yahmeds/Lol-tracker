import { useState, useEffect, useRef, useCallback } from 'react'
import { resolvePUUID, getActiveGame, parsePlayer, playerSlug, getGamePhase, getQueueLabel } from '../lib/riot'
import { saveGame, updateGameDuration, fetchGamesLast30Days } from '../lib/supabase'

const LOCAL_GAMES_KEY = 'coachscan_games'

// ─── Local fallback storage ───────────────────────────────────────────────────

function loadLocalGames() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_GAMES_KEY) || '[]')
  } catch { return [] }
}

function saveLocalGames(games) {
  localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(games))
}

function todayStr() {
  return new Date().toDateString()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTracker(settings, isConfigured) {
  const [status, setStatus] = useState('idle') // idle | resolving | watching | queue | loading | ingame | error
  const [errorMsg, setErrorMsg] = useState('')
  const [currentGame, setCurrentGame] = useState(null)
  const [allGames, setAllGames] = useState([])
  const [puuid, setPuuid] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  const stateRef = useRef({})
  const pollRef = useRef(null)
  const notifiedGameIds = useRef(new Set())

  // Sync ref for use inside intervals
  stateRef.current = { settings, puuid, currentGame, allGames }

  // ─── Load games ─────────────────────────────────────────────────────────────

  async function loadGames(slug) {
    try {
      const remote = await fetchGamesLast30Days(slug)
      if (remote.length > 0) {
        setAllGames(remote)
        saveLocalGames(remote)
        return
      }
    } catch {}
    setAllGames(loadLocalGames())
  }

  // ─── Add game ────────────────────────────────────────────────────────────────

  function addGame(gameData, phase) {
    const { settings: s } = stateRef.current
    const { gameName, tagLine } = parsePlayer(s.player)
    const slug = playerSlug(s.player)
    const now = new Date()

    const game = {
      game_id: String(gameData.gameId),
      player_slug: slug,
      game_name: `${gameName}#${tagLine}`,
      queue_id: gameData.gameQueueConfigId,
      queue_label: getQueueLabel(gameData.gameQueueConfigId),
      started_at: new Date(gameData.gameStartTime || Date.now()).toISOString(),
      duration_min: null,
      ended_at: null,
      date_str: now.toDateString(),
    }

    setAllGames(prev => {
      const exists = prev.find(g => g.game_id === game.game_id)
      if (exists) return prev
      const next = [...prev, game]
      saveLocalGames(next)
      return next
    })

    saveGame(game).catch(() => {})

    // Send notification
    if (!notifiedGameIds.current.has(game.game_id)) {
      notifiedGameIds.current.add(game.game_id)
      sendNotification(s.player, phase, game.queue_label)
    }
  }

  // ─── End game ────────────────────────────────────────────────────────────────

  function endGame(gameId, startedAt) {
    const durationMin = Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)
    setAllGames(prev => {
      const next = prev.map(g =>
        g.game_id === gameId
          ? { ...g, duration_min: durationMin, ended_at: new Date().toISOString() }
          : g
      )
      saveLocalGames(next)
      return next
    })
    updateGameDuration(gameId, durationMin).catch(() => {})
  }

  // ─── Poll ────────────────────────────────────────────────────────────────────

  const poll = useCallback(async () => {
    const { settings: s, puuid: pid, currentGame: cg } = stateRef.current
    if (!pid || !s.apiKey) return

    const { tagLine } = parsePlayer(s.player)

    try {
      const gameData = await getActiveGame(pid, tagLine, s.apiKey)
      const phase = getGamePhase(gameData)
      const gameId = String(gameData.gameId)

      setCurrentGame(gameData)
      setStatus(phase)
      setLastChecked(new Date())

      // New game detected
      if (!cg || String(cg.gameId) !== gameId) {
        addGame(gameData, phase)
      }
    } catch (err) {
      setLastChecked(new Date())
      if (err.status === 404) {
        // Not in game
        if (stateRef.current.currentGame) {
          const cg = stateRef.current.currentGame
          endGame(String(cg.gameId), cg.gameStartTime ? new Date(cg.gameStartTime).toISOString() : new Date().toISOString())
        }
        setCurrentGame(null)
        setStatus('watching')
      } else if (err.status === 401 || err.status === 403) {
        setStatus('error')
        setErrorMsg('Clé API invalide ou expirée')
        stopPolling()
      } else {
        console.warn('Poll error:', err.message)
      }
    }
  }, [])

  function startPolling(intervalSec) {
    stopPolling()
    poll()
    pollRef.current = setInterval(poll, intervalSec * 1000)
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  // ─── Init / restart when settings change ─────────────────────────────────────

  useEffect(() => {
    if (!isConfigured) {
      setStatus('idle')
      stopPolling()
      return
    }

    const { gameName, tagLine } = parsePlayer(settings.player)
    const slug = playerSlug(settings.player)

    setStatus('resolving')
    setErrorMsg('')

    resolvePUUID(gameName, tagLine, settings.apiKey)
      .then(data => {
        setPuuid(data.puuid)
        setStatus('watching')
        loadGames(slug)
        startPolling(settings.interval)
      })
      .catch(err => {
        setStatus('error')
        setErrorMsg(err.message || 'Erreur Riot API')
      })

    return () => stopPolling()
  }, [settings.apiKey, settings.player, settings.interval, isConfigured])

  // Sync puuid into ref
  useEffect(() => { stateRef.current.puuid = puuid }, [puuid])

  // ─── Derived daily stats ──────────────────────────────────────────────────────

  const todayGames = allGames.filter(g => g.date_str === todayStr())
  const totalMinToday = todayGames.reduce((acc, g) => acc + (g.duration_min || 0), 0)

  return {
    status,
    errorMsg,
    currentGame,
    allGames,
    todayGames,
    totalMinToday,
    lastChecked,
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function sendNotification(player, phase, queueLabel) {
  const titles = {
    queue: `⏳ ${player} est en sélection !`,
    loading: `⚔️ ${player} charge une game !`,
    ingame: `🎮 ${player} est en game !`,
  }
  const title = titles[phase] || `🎮 ${player} a lancé une game !`
  const body = queueLabel || ''

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  }
}
