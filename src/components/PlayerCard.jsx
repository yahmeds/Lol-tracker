import { getQueueLabel, formatGameDuration } from '../lib/riot'
import styles from './PlayerCard.module.css'

export default function PlayerCard({ player, status, currentGame }) {
  const [name, tag] = (player || '').split('#')
  const isActive = ['queue', 'loading', 'ingame'].includes(status)

  const queueLabel = currentGame ? getQueueLabel(currentGame.gameQueueConfigId) : null
  const gameDuration = currentGame?.gameLength
    ? formatGameDuration(currentGame.gameLength)
    : null

  const phaseLabel = {
    queue:   '⏳ EN SÉLECTION',
    loading: '⚙ CHARGEMENT',
    ingame:  '⚔ EN GAME',
  }[status]

  return (
    <div className={`${styles.card} ${isActive ? styles.active : ''}`}>
      <div className={styles.topLine} />

      <div className={styles.playerLabel}>Joueur surveillé</div>

      <div className={styles.playerName}>
        {name || '—'}
        {tag && <span className={styles.tag}>#{tag}</span>}
      </div>

      <div className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeIdle}`}>
        {isActive ? phaseLabel : '⬤ En attente'}
      </div>

      {isActive && (queueLabel || gameDuration) && (
        <div className={styles.gameInfo}>
          {queueLabel && <span className={styles.queueLabel}>{queueLabel}</span>}
          {gameDuration && <span className={styles.duration}>{gameDuration}</span>}
        </div>
      )}
    </div>
  )
}
