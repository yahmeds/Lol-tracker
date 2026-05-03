import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars missing. Data will be stored locally only.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ─── Config ───────────────────────────────────────────────────────────────────

export async function saveConfig({ player, apiKey }) {
  if (!supabase) return
  const { error } = await supabase
    .from('config')
    .upsert({ id: 1, player, api_key: apiKey, updated_at: new Date().toISOString() })
  if (error) console.error('Supabase saveConfig error:', error)
}

export async function loadConfig() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('config')
    .select('player, api_key, interval')
    .eq('id', 1)
    .single()
  if (error) return null
  return data ? { player: data.player } : null
}

// ─── Games ────────────────────────────────────────────────────────────────────

export async function saveGame(game) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('games')
    .upsert(game, { onConflict: 'game_id' })
    .select()
    .single()
  if (error) console.error('Supabase saveGame error:', error)
  return data
}

export async function fetchGamesLast30Days(playerSlug) {
  if (!supabase) return []
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('player_slug', playerSlug)
    .gte('started_at', from.toISOString())
    .order('started_at', { ascending: true })
  if (error) console.error('Supabase fetchGames error:', error)
  return data || []
}

export async function updateGameDuration(gameId, durationMin) {
  if (!supabase) return
  const { error } = await supabase
    .from('games')
    .update({ duration_min: durationMin, ended_at: new Date().toISOString() })
    .eq('game_id', gameId)
  if (error) console.error('Supabase updateGameDuration error:', error)
}