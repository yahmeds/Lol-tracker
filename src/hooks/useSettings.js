import { useState, useEffect } from 'react'
import { saveConfig, loadConfig } from '../lib/supabase'

const SETTINGS_KEY = 'coachscan_settings'

const defaultSettings = {
  apiKey: '',
  players: [],
  currentPlayer: '',
}

export function useSettings() {
  const [settings, setSettingsState] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (!stored) return defaultSettings
      const parsed = JSON.parse(stored)
      // Migration: old format had 'player' (string), new format has 'players' (array)
      if (parsed.player && !parsed.players?.length) {
        parsed.players = [parsed.player]
        parsed.currentPlayer = parsed.currentPlayer || parsed.player
        delete parsed.player
      }
      return { ...defaultSettings, ...parsed }
    } catch {
      return defaultSettings
    }
  })

  async function saveSettings(next) {
    const merged = { ...settings, ...next }
    setSettingsState(merged)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
    await saveConfig({ players: merged.players })
  }

  function clearSettings() {
    setSettingsState(defaultSettings)
    localStorage.removeItem(SETTINGS_KEY)
  }

  const isConfigured = !!(settings.apiKey && settings.currentPlayer)

  return { settings, saveSettings, clearSettings, isConfigured }
}