import { useState, useEffect } from 'react'

const SETTINGS_KEY = 'coachscan_settings'

const defaultSettings = {
  apiKey: '',
  player: '',
  interval: 60,
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

  function saveSettings(next) {
    const merged = { ...settings, ...next }
    setSettingsState(merged)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
  }

  function clearSettings() {
    setSettingsState(defaultSettings)
    localStorage.removeItem(SETTINGS_KEY)
  }

  const isConfigured = !!(settings.apiKey && settings.player)

  return { settings, saveSettings, clearSettings, isConfigured }
}
