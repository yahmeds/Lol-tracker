import { useState, useEffect } from 'react'
import styles from './SettingsModal.module.css'



export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [apiKey, setApiKey]   = useState('')
  const [player, setPlayer]   = useState('')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setApiKey(settings.apiKey || '')
      setPlayer(settings.player || '')
    }
  }, [isOpen, settings])

  function handleSave() {
    if (!apiKey.trim()) { alert('Entre ta clé API Riot Games'); return }
    if (!player.trim() || !player.includes('#')) {
      alert('Format attendu : NomJoueur#TAG (ex: ALDERIATE#EUW)')
      return
    }
    onSave({ apiKey: apiKey.trim(), player: player.trim(), interval })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.title}>⚙ PARAMÈTRES</div>

        <div className={styles.field}>
          <label className={styles.label}>Clé API Riot Games</label>
          <div className={styles.inputRow}>
            <input
              type={showKey ? 'text' : 'password'}
              className={styles.input}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
            />
            <button className={styles.eyeBtn} onClick={() => setShowKey(v => !v)}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <div className={styles.hint}>
            → <a href="https://developer.riotgames.com" target="_blank" rel="noreferrer" className={styles.link}>
              developer.riotgames.com
            </a> (gratuit, clé dev valable 24h)
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Joueur (GameName#TagLine)</label>
          <input
            type="text"
            className={styles.input}
            value={player}
            onChange={e => setPlayer(e.target.value)}
            placeholder="ALDERIATE#EUW"
            autoComplete="off"
          />
        </div>

        <button className={styles.btnPrimary} onClick={handleSave}>
          DÉMARRER LE TRACKING
        </button>
        <button className={styles.btnSecondary} onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  )
}
