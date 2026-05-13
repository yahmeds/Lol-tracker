import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
)

const QUEUE_LABELS = {
  420: 'Ranked Solo/Duo', 430: 'Normal (Blind)', 440: 'Ranked Flex',
  450: 'ARAM', 490: 'Normal (Draft)', 700: 'Clash',
  900: 'URF', 1700: 'Arena', 0: 'Personnalisée',
}

function getRegions(tagLine = 'EUW') {
  const t = tagLine.toUpperCase()
  if (['EUW', 'EUNE', 'TR', 'RU'].includes(t)) return { account: 'europe', spectator: 'euw1' }
  if (['NA', 'LAN', 'LAS', 'BR'].includes(t))  return { account: 'americas', spectator: 'na1' }
  if (['KR', 'JP'].includes(t))                 return { account: 'asia', spectator: 'kr' }
  return { account: 'europe', spectator: 'euw1' }
}

async function riotFetch(url, apiKey) {
  const res = await fetch(url, { headers: { 'X-Riot-Token': apiKey } })
  if (!res.ok) {
    const err = new Error(`Riot HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

async function notifyTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) console.error('Telegram notify failed:', res.status)
  } catch (err) {
    console.error('Telegram notify error:', err.message)
  }
}

async function pollSinglePlayer(player, apiKey, puuids) {
  const [gameName, tagLine] = player.split('#')
  const { account, spectator } = getRegions(tagLine)
  const playerSlug = player.toLowerCase().replace('#', '-')

  let puuid = puuids[playerSlug]
  let puuidsUpdated = false

  // Resolve PUUID if not cached
  if (!puuid) {
    const accountData = await riotFetch(
      `https://${account}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      apiKey
    )
    puuid = accountData.puuid
    puuids[playerSlug] = puuid
    puuidsUpdated = true
  }

  // Poll for active game
  let gameData = null
  try {
    gameData = await riotFetch(
      `https://${spectator}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
      apiKey
    )
  } catch (err) {
    if (err.status === 404) {
      // Player not in game: close any open games for this player
      const { data: openGames } = await supabase
        .from('games')
        .select('*')
        .eq('player_slug', playerSlug)
        .is('ended_at', null)

      if (openGames?.length > 0) {
        for (const openGame of openGames) {
          const durationMin = Math.round(
            (Date.now() - new Date(openGame.started_at).getTime()) / 60000
          )
          await supabase
            .from('games')
            .update({ ended_at: new Date().toISOString(), duration_min: durationMin })
            .eq('id', openGame.id)
        }
      }
      return { puuidsUpdated, puuids }
    }
    throw err
  }

  // Game found: insert if new
  const gameId = String(gameData.gameId)
  const { data: existing } = await supabase
    .from('games')
    .select('id')
    .eq('game_id', gameId)
    .single()

  if (!existing) {
    await supabase.from('games').insert({
      game_id: gameId,
      player_slug: playerSlug,
      game_name: player,
      queue_id: gameData.gameQueueConfigId,
      queue_label: QUEUE_LABELS[gameData.gameQueueConfigId] || `Mode ${gameData.gameQueueConfigId}`,
      started_at: new Date(gameData.gameStartTime || Date.now()).toISOString(),
      date_str: new Date().toDateString(),
    })

    const queueLabel = QUEUE_LABELS[gameData.gameQueueConfigId] || `Mode ${gameData.gameQueueConfigId}`
    const timeStr = new Date(gameData.gameStartTime || Date.now()).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
    })
    await notifyTelegram(`🎮 *${player}* vient de démarrer une partie *${queueLabel}* à ${timeStr}`)
  }

  return { puuidsUpdated, puuids }
}

export default async function handler(req, res) {
  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { data: config, error: configError } = await supabase
      .from('config')
      .select('*')
      .eq('id', 1)
      .single()

    if (configError || !config?.api_key) {
      return res.status(200).json({ message: 'No config found, skipping' })
    }

    // Backward compatibility: if players array is empty, fallback to single player
    const players = config.players?.length ? config.players : (config.player ? [config.player] : [])
    if (players.length === 0) {
      return res.status(200).json({ message: 'No players configured, skipping' })
    }

    const { api_key } = config
    let puuids = config.puuids || {}
    let puuidsUpdated = false

    for (const player of players) {
      try {
        const result = await pollSinglePlayer(player, api_key, puuids)
        if (result.puuidsUpdated) {
          puuids = result.puuids
          puuidsUpdated = true
        }
      } catch (err) {
        console.error(`Error polling ${player}:`, err.message)
        // Continue with next player instead of failing entirely
      }
    }

    // Save updated PUUIDs cache if anything changed
    if (puuidsUpdated) {
      await supabase.from('config').update({ puuids }).eq('id', 1)
    }

    return res.status(200).json({ message: `Polled ${players.length} player(s)` })

  } catch (err) {
    console.error('Cron error:', err)
    return res.status(500).json({ error: err.message })
  }
}