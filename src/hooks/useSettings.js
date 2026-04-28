import { useState, useEffect } from 'react'
import { saveConfig, loadConfig } from '../lib/supabase'

const SETTINGS_KEY = 'coachscan_settings'

const defaultSettings = {
  apiKey: '',
  player: '',
}

export function useSettings() {
  const [settings, setSettingsState] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
    } catch {
      return defaultSettings
    }
  })

  useEffect(() => {
    loadConfig().then(remote => {
      if (remote?.player) {
        setSettingsState(prev => {
          const merged = { ...prev, player: remote.player }
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
          return merged
        })
      }
    }).catch(() => {})
  }, [])


  async function saveSettings(next) {
    const merged = { ...settings, ...next }
    setSettingsState(merged)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
    await saveConfig({ player: merged.player })
  }

  function clearSettings() {
    setSettingsState(defaultSettings)
    localStorage.removeItem(SETTINGS_KEY)
  }

  const isConfigured = !!(settings.apiKey && settings.player)

  return { settings, saveSettings, clearSettings, isConfigured }
}

//DEBUG
async function saveSettings(next) {
  const merged = { ...settings, ...next }
  setSettingsState(merged)
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
  console.log('Saving to Supabase:', merged)
  const result = await saveConfig(merged)
  console.log('Supabase result:', result)
}