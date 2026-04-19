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


function Calendar({ allGames, selectedKey, onSelect }) {
  const [monthOffset, setMonthOffset] = useState(0)

  const today = new Date()
  const displayMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthLabel = displayMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const gamesByDay = useMemo(() => {
    const map = {}
    for (const g of allGames) {
      const key = toDateKey(new Date(g.started_at))
      if (!map[key]) map[key] = []
      map[key].push(g)
    }
    return map
  }, [allGames])

  const firstDay = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1)
  const lastDay  = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0)

  let startPad = firstDay.getDay() - 1
  if (startPad < 0) startPad = 6

  const days = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), d))
  }

  const canGoNext = monthOffset < 0

  return (
    <div className={styles.calendar}>
      <div className={styles.calNav}>
        <button className={styles.calBtn} onClick={() => setMonthOffset(o => o - 1)}>‹</button>
        <span className={styles.calMonth}>{monthLabel}</span>
        <button
          className={styles.calBtn}
          onClick={() => setMonthOffset(o => o + 1)}
          disabled={!canGoNext}
          style={{ opacity: canGoNext ? 1 : 0.3 }}
        >›</button>
      </div>

      <div className={styles.calGrid}>
        {['L','M','M','J','V','S','D'].map((d, i) => (
          <div key={i} className={styles.calDayLabel}>{d}</div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />
          const key = toDateKey(date)
          const count = gamesByDay[key]?.length || 0
          const isToday = toDateKey(today) === key
          const isSelected = selectedKey === key
          const isFuture = date > today

          return (
            <button
              key={key}
              className={`
                ${styles.calDay}
                ${count > 0 ? styles.calDayHasGames : ''}
                ${isToday ? styles.calDayToday : ''}
                ${isSelected ? styles.calDaySelected : ''}
                ${isFuture ? styles.calDayFuture : ''}
              `}
              onClick={() => !isFuture && onSelect(key)}
              disabled={isFuture}
            >
              <span className={styles.calDayNum}>{date.getDate()}</span>
              {count > 0 && (
                <span className={styles.calDayDot} style={{
                  background: count >= 5 ? 'var(--red)' : count >= 3 ? 'var(--gold)' : 'var(--green)'
                }} />
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.calLegend}>
        <span><span className={styles.legendDot} style={{background:'var(--green)'}}/>1-2 games</span>
        <span><span className={styles.legendDot} style={{background:'var(--gold)'}}/>3-4 games</span>
        <span><span className={styles.legendDot} style={{background:'var(--red)'}}/>5+ games</span>
      </div>
    </div>
  )
}

function DayDetail({ dateKey, games, isToday, countdown }) {
  const date = new Date(dateKey)
  const label = isToday
    ? "Aujourd'hui"
    : date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const totalMin = games.reduce((a, g) => a + (g.duration_min || 0), 0)

  return (
    <div className={styles.dayDetail}>
      <div className={styles.dayDetailHeader}>
        <div className={styles.dayDetailLabel}>{label}</div>
        {isToday && <div className={styles.reset}>Reset dans <span>{countdown}</span></div>}
      </div>

      <div className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Games jouées</div>
          <div className={styles.statValue}>{games.length}</div>
          <div className={styles.statUnit}>{isToday ? "aujourd'hui" : 'ce jour-là'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Temps de jeu</div>
          <div className={`${styles.statValue} ${styles.time}`}>{formatHoursMin(totalMin)}</div>
          <div className={styles.statUnit}>estimé</div>
        </div>
      </div>

      <div className={styles.historyTitle}>PARTIES</div>
      {games.length === 0 ? (
        <div className={styles.empty}>Aucune partie ce jour-là</div>
      ) : (
        <div className={styles.list}>
          {[...games].reverse().map(g => (
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
                {g.duration_min
                  ? `${g.duration_min} min`
                  : <span className={styles.live}>● live</span>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
