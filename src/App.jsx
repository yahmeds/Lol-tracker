import { useState, useEffect } from 'react'
import { useSettings } from './hooks/useSettings'
import { useTracker, requestNotifPermission } from './hooks/useTracker'
import StatusBar from './components/StatusBar'
import PlayerCard from './components/PlayerCard'
import DailyBoard from './components/DailyBoard'
import StatsChart from './components/StatsChart'
import SettingsModal from './components/SettingsModal'
import Toast, { showToast } from './components/Toast'
import styles from './App.module.css'

function PlayerSelector({ players, current, onChange }) {
  if (players.length < 2) return null
  return (
    <select
      value={current}
      onChange={e => onChange(e.target.value)}
      className={styles.playerSelector}
      aria-label="Sélectionner un joueur"
    >
      {players.map(p => <option key={p} value={p}>{p}</option>)}
    </select>
  )
}

export default function App() {
  const { settings, saveSettings, isConfigured } = useSettings()
  const [modalOpen, setModalOpen] = useState(!isConfigured)
  const [activeTab, setActiveTab] = useState('today') // today | chart

  const {
    status,
    errorMsg,
    currentGame,
    allGames,
    todayGames,
    totalMinToday,
    lastChecked,
  } = useTracker(settings, isConfigured)

  // Request notification permission once configured
  useEffect(() => {
    if (isConfigured) requestNotifPermission()
  }, [isConfigured])

  // Toast on game detection
  useEffect(() => {
    if (status === 'queue')   showToast(`⏳ ${settings.currentPlayer} est en sélection !`, 'info')
    if (status === 'ingame')  showToast(`🎮 ${settings.currentPlayer} a lancé une game !`, 'info')
  }, [status, settings.currentPlayer])

  // Toast on error
  useEffect(() => {
    if (status === 'error') showToast(`❌ ${errorMsg}`, 'error')
  }, [status, errorMsg])

  function handleSaveSettings(next) {
    saveSettings(next)
    showToast(' Paramètres sauvegardés', 'success')
  }

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <div className={styles.logo}>
            COACH<span className={styles.logoAccent}>SCAN</span>
          </div>
          <div className={styles.logoSub}>League of Legends Tracker</div>
        </div>
        <button className={styles.settingsBtn} onClick={() => setModalOpen(true)} aria-label="Paramètres">
          ⚙️
        </button>
      </header>

      {/* Player selector dropdown */}
      <div className={styles.section}>
        <PlayerSelector
          players={settings.players}
          current={settings.currentPlayer}
          onChange={p => saveSettings({ currentPlayer: p })}
        />
      </div>

      {/* Status + progress */}
      <div className={styles.section}>
        <StatusBar
          status={status}
          errorMsg={errorMsg}
          lastChecked={lastChecked}
          interval={settings.interval}
        />
      </div>

      {/* Player card */}
      <div className={styles.section}>
        <PlayerCard
          player={settings.currentPlayer}
          status={status}
          currentGame={currentGame}
        />
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'today' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Aujourd'hui
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'chart' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          Stats 30j
        </button>
      </div>

      {/* Tab content */}
      <div className={styles.section}>
        {activeTab === 'today' ? (
          <DailyBoard
            todayGames={todayGames}
            totalMinToday={totalMinToday}
            allGames={allGames}
          />
        ) : (
          <StatsChart allGames={allGames} />
        )}
      </div>

      {/* Settings modal */}
      <SettingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Toast notifications */}
      <Toast />
    </div>
  )
}
