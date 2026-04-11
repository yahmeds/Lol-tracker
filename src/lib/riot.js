// ─── Region helpers ───────────────────────────────────────────────────────────

export function getRegions(tagLine = 'EUW') {
  const t = tagLine.toUpperCase()
  if (['EUW', 'EUNE', 'TR', 'RU'].includes(t)) return { account: 'europe', spectator: 'euw1' }
  if (['NA', 'LAN', 'LAS', 'BR'].includes(t))  return { account: 'americas', spectator: 'na1' }
  if (['KR', 'JP'].includes(t))                 return { account: 'asia', spectator: 'kr' }
  return { account: 'europe', spectator: 'euw1' }
}

export function parsePlayer(raw) {
  const [gameName, tagLine] = (raw || '').split('#')
  return { gameName: gameName?.trim(), tagLine: tagLine?.trim() || 'EUW' }
}

export function playerSlug(raw) {
  return raw.toLowerCase().replace('#', '-')
}

// ─── API fetch wrapper ────────────────────────────────────────────────────────

async function riotFetch(url, apiKey) {
  const res = await fetch(url, { headers: { 'X-Riot-Token': apiKey } })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body?.status?.message || `HTTP ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  return res.json()
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function resolvePUUID(gameName, tagLine, apiKey) {
  const { account } = getRegions(tagLine)
  return riotFetch(
    `https://${account}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    apiKey
  )
}

export async function getActiveGame(puuid, tagLine, apiKey) {
  const { spectator } = getRegions(tagLine)
  return riotFetch(
    `https://${spectator}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
    apiKey
  )
}

// ─── Queue status labels ──────────────────────────────────────────────────────

const QUEUE_LABELS = {
  420: 'Ranked Solo/Duo',
  430: 'Normal (Blind)',
  440: 'Ranked Flex',
  450: 'ARAM',
  490: 'Normal (Draft)',
  700: 'Clash',
  830: 'Bot (Intro)',
  840: 'Bot (Beginner)',
  850: 'Bot (Intermediate)',
  900: 'URF',
  1020: 'One for All',
  1300: 'Nexus Blitz',
  1400: 'Ultimate Spellbook',
  1700: 'Arena',
  0: 'Personnalisée',
}

export function getQueueLabel(queueId) {
  return QUEUE_LABELS[queueId] || `Mode ${queueId}`
}

// ─── Game phase detection ─────────────────────────────────────────────────────

// Riot returns gameLength in seconds; gameStartTime is a ms timestamp
// If gameStartTime is 0 or very small, the game is still in champ select / loading

export function getGamePhase(gameData) {
  if (!gameData) return null
  const len = gameData.gameLength || 0
  const started = gameData.gameStartTime || 0
  if (len < 10 && started < 1000000) return 'queue' // in lobby/champ select
  if (len < 90) return 'loading' // loading screen
  return 'ingame'
}

export function formatGameDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}
