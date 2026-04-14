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

    if (configError || !config?.api_key || !config?.player) {
      return res.status(200).json({ message: 'No config found, skipping' })
    }

    const { api_key, player } = config
    const [gameName, tagLine] = player.split('#')
    const { account, spectator } = getRegions(tagLine)

    let puuid = config.puuid
    if (!puuid) {
      const accountData = await riotFetch(
        `https://${account}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        api_key
      )
      puuid = accountData.puuid
      await supabase.from('config').update({ puuid }).eq('id', 1)
    }

    let gameData = null
    try {
      gameData = await riotFetch(
        `https://${spectator}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
        api_key
      )
    } catch (err) {
      if (err.status === 404) {
        const { data: openGame } = await supabase
          .from('games')
          .select('*')
          .eq('player_slug', player.toLowerCase().replace('#', '-'))
          .is('ended_at', null)
          .single()

        if (openGame) {
          const durationMin = Math.round(
            (Date.now() - new Date(openGame.started_at).getTime()) / 60000
          )
          await supabase
            .from('games')
            .update({ ended_at: new Date().toISOString(), duration_min: durationMin })
            .eq('id', openGame.id)
        }

        return res.status(200).json({ message: 'Player not in game' })
      }

      return res.status(200).json({ message: `Riot API error: ${err.message}` })
    }

    const gameId = String(gameData.gameId)
    const playerSlug = player.toLowerCase().replace('#', '-')

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

      return res.status(200).json({ message: `New game detected: ${gameId}` })
    }

    return res.status(200).json({ message: `Game ${gameId} already tracked` })

  } catch (err) {
    console.error('Cron error:', err)
    return res.status(500).json({ error: err.message })
  }
}