import styles from './DailyBoard.module.css'

function formatHoursMin(totalMin) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function useResetCountdown() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const diff = Math.floor((midnight - now) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export default function DailyBoard({ todayGames, totalMinToday }) {
  const countdown = useResetCountdown()

  return (
    <div className={styles.board}>
      <div className={styles.header}>
        <div className={styles.title}>DAILY BOARD</div>
        <div className={styles.reset}>Reset dans <span>{countdown}</span></div>
      </div>

      <div className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Games jouées</div>
          <div className={styles.statValue}>{todayGames.length}</div>
          <div className={styles.statUnit}>aujourd'hui</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Temps de jeu</div>
          <div className={`${styles.statValue} ${styles.time}`}>
            {formatHoursMin(totalMinToday)}
          </div>
          <div className={styles.statUnit}>estimé</div>
        </div>
      </div>

      <div className={styles.historyTitle}>PARTIES DU JOUR</div>
      {todayGames.length === 0 ? (
        <div className={styles.empty}>Aucune partie détectée aujourd'hui</div>
      ) : (
        <div className={styles.list}>
          {[...todayGames].reverse().map(g => (
            <div key={g.game_id} className={styles.item}>
              <div className={styles.itemDot} />
              <div className={styles.itemLeft}>
                <span className={styles.itemTime}>
                  {new Date(g.started_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {g.queue_label && (
                  <span className={styles.itemQueue}>{g.queue_label}</span>
                )}
              </div>
              <div className={styles.itemDuration}>
                {g.duration_min ? `${g.duration_min} min` : <span className={styles.live}>● live</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
