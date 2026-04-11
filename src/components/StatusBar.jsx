import styles from './StatusBar.module.css'

const STATUS_CONFIG = {
  idle:      { dot: 'idle',     label: 'Non configuré — ouvre les paramètres' },
  resolving: { dot: 'loading',  label: 'Résolution du joueur...' },
  watching:  { dot: 'watching', label: 'Surveillance active' },
  queue:     { dot: 'ingame',   label: 'En sélection de champion' },
  loading:   { dot: 'ingame',   label: 'Chargement de la partie...' },
  ingame:    { dot: 'ingame',   label: 'En game !' },
  error:     { dot: 'error',    label: 'Erreur' },
}

export default function StatusBar({ status, errorMsg, lastChecked, interval }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle

  const lastCheckedStr = lastChecked
    ? lastChecked.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className={styles.bar}>
      <div className={`${styles.dot} ${styles[cfg.dot]}`} />
      <div className={styles.text}>
        <span className={styles.label}>
          {status === 'error' ? errorMsg : cfg.label}
        </span>
        {lastCheckedStr && (
          <span className={styles.sub}>vérifié à {lastCheckedStr}</span>
        )}
      </div>
    </div>
  )
}
