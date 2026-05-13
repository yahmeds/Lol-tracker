import { useState, useEffect } from 'react'
import styles from './SettingsModal.module.css'



export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [apiKey, setApiKey]   = useState('')
  const [newPlayer, setNewPlayer] = useState('')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setApiKey(settings.apiKey || '')
      setNewPlayer('')
    }
  }, [isOpen, settings])

  function handleSave() {
    if (!apiKey.trim()) { alert('Entre ta clé API Riot Games'); return }

    let playersToSave = settings.players || []
    let currentPlayerToSet = settings.currentPlayer

    if (newPlayer.trim()) {
      if (!newPlayer.includes('#')) {
        alert('Format attendu : NomJoueur#TAG (ex: ALDERIATE#EUW)')
        return
      }
      const playerTrimmed = newPlayer.trim()
      playersToSave = [...playersToSave, playerTrimmed]
      currentPlayerToSet = playerTrimmed
    }

    if (playersToSave.length === 0) {
      alert('Tu dois avoir au moins un joueur tracké')
      return
    }

    onSave({
      apiKey: apiKey.trim(),
      players: playersToSave,
      currentPlayer: currentPlayerToSet
    })
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
            Stockée localement uniquement — jamais envoyée au serveur
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Joueurs trackés</label>
          {settings.players && settings.players.length > 0 ? (
            <div className={styles.playersList}>
              {settings.players.map(p => (
                <div key={p} className={styles.playerItem}>
                   {p}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.hint}>Aucun joueur tracké pour le moment</div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Ajouter un joueur</label>
          <input
            type="text"
            className={styles.input}
            value={newPlayer}
            onChange={e => setNewPlayer(e.target.value)}
            placeholder="NomJoueur#TAG (ex: ALDERIATE#EUW)"
            autoComplete="off"
          />
          <div className={styles.hint}>
            Laisse vide pour garder les joueurs actuels
          </div>
        </div>

        <button className={styles.btnPrimary} onClick={handleSave}>
          SAUVEGARDER
        </button>
        <button className={styles.btnSecondary} onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  )
}
