import { useState, useEffect } from 'react'
import styles from './SettingsModal.module.css'

const INTERVALS = [
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
]

export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [apiKey, setApiKey]   = useState('')
  const [player, setPlayer]   = useState('')
  const [interval, setInterval] = useState(60)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setApiKey(settings.apiKey || '')
      setPlayer(settings.player || '')
      setInterval(settings.interval || 60)
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

        <div className={styles.field}>
          <label className={styles.label}>Vérification toutes les</label>
          <div className={styles.chips}>
            {INTERVALS.map(opt => (
              <button
                key={opt.value}
                className={`${styles.chip} ${interval === opt.value ? styles.chipActive : ''}`}
                onClick={() => setInterval(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className={styles.hint}>
            ⚠ Les clés dev Riot ont une limite de 100 requêtes/2min
          </div>
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
