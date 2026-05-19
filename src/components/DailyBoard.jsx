import { useState, useMemo } from 'react'
import styles from './DailyBoard.module.css'

function formatHoursMin(totalMin) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function toDateKey(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function gameToDateKey(startedAt) {
  const d = new Date(startedAt)
  if (d.getHours() < 8) d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function useResetCountdown() {
  const now = new Date()
  const midnight = new Date(now)
  if (now.getHours() < 8) {
    midnight.setHours(8, 0, 0, 0)
  } else {
    midnight.setDate(midnight.getDate() + 1)
    midnight.setHours(8, 0, 0, 0)
  }
  const diff = Math.floor((midnight - now) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function hhmm(date) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}


function generateSummary(games) {
  if (games.length === 0) return null
 
  const sorted = [...games].sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
 
  const SESSION_GAP = 30
  const sessions = []
  let current = [sorted[0]]
 
  for (let i = 1; i < sorted.length; i++) {
    const prev = current[current.length - 1]
    const prevEnd = prev.ended_at
      ? new Date(prev.ended_at)
      : new Date(new Date(prev.started_at).getTime() + (prev.duration_min || 30) * 60000)
    const gap = (new Date(sorted[i].started_at) - prevEnd) / 60000
 
    if (gap <= SESSION_GAP) {
      current.push(sorted[i])
    } else {
      sessions.push(current)
      current = [sorted[i]]
    }
  }
  sessions.push(current)
 
  const parts = []
 
  sessions.forEach((session, idx) => {
    const count = session.length
    const firstGame = session[0]
    const lastGame = session[session.length - 1]
    const startTime = hhmm(firstGame.started_at)
    const endTime = lastGame.ended_at ? hhmm(lastGame.ended_at) : null
 
    if (count === 1) {
      parts.push({ type: 'game', text: `1 game à ${startTime}${endTime ? ` → ${endTime}` : ''}` })
    } else {
      parts.push({ type: 'game', text: `${count} games de ${startTime}${endTime ? ` à ${endTime}` : ''}` })
    }
 
    if (idx < sessions.length - 1) {
      const nextSession = sessions[idx + 1]
      const endOfCurrent = lastGame.ended_at
        ? new Date(lastGame.ended_at)
        : new Date(new Date(lastGame.started_at).getTime() + (lastGame.duration_min || 30) * 60000)
      const startOfNext = new Date(nextSession[0].started_at)
      const gapMin = Math.round((startOfNext - endOfCurrent) / 60000)
 
      if (gapMin >= 60) {
        const gapH = Math.floor(gapMin / 60)
        const gapM = gapMin % 60
        const gapStr = gapM > 0 ? `${gapH}h${String(gapM).padStart(2,'0')}` : `${gapH}h`
        parts.push({ type: 'pause', text: `pause ${gapStr}` })
      } else {
        parts.push({ type: 'pause', text: `pause ${gapMin} min` })
      }
    }
  })
 
 /* const lastGame = sorted[sorted.length - 1]
  if (!lastGame.ended_at) {
    parts.push({ type: 'live', text: 'session en cours' })
  } else {
    parts.push({ type: 'end', text: `inactif depuis ${hhmm(lastGame.ended_at)}` })
  } */
 
  return parts
}

// ─── Calendar ────────────────────────────────────────────────────────────────

function Calendar({ allGames, selectedKey, onSelect }) {
  const [monthOffset, setMonthOffset] = useState(0)

  const today = new Date()
  const displayMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthLabel = displayMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // Build a set of dateKeys that have games
  const gamesByDay = useMemo(() => {
    const map = {}
    for (const g of allGames) {
      const key = gameToDateKey(g.started_at)
      if (!map[key]) map[key] = []
      map[key].push(g)
    }
    return map
  }, [allGames])

  // Days in this month
  const firstDay = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1)
  const lastDay  = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0)

  // Padding before first day (Monday = 0)
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
                  background: count >= 9 ? 'var(--red)' : count >= 5 ? 'var(--gold)' : 'var(--green)'
                }} />
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.calLegend}>
        <span><span className={styles.legendDot} style={{background:'var(--green)'}}/>1-4 games</span>
        <span><span className={styles.legendDot} style={{background:'var(--gold)'}}/>5-8 games</span>
        <span><span className={styles.legendDot} style={{background:'var(--red)'}}/>9+ games</span>
      </div>
    </div>
  )
}

// ─── Day detail ───────────────────────────────────────────────────────────────

function DayDetail({ dateKey, games, isToday, countdown }) {
  const date = new Date(dateKey)
  const label = isToday
    ? "Aujourd'hui"
    : date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const totalMin = games.reduce((a, g) => a + (g.duration_min || 0), 0)
  const summary = generateSummary(games)

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

      {summary && (
        <div className={styles.summary}>
          {summary.map((part, i) => (
            <span
              key={i}
              className={`${styles.summaryPart} ${styles['summaryType_' + part.type] || ''}`}
            >
              {part.type === 'pause' ? '···' : part.type === 'end' ? '◻' : part.type === 'live' ? '●' : ''} {part.text}
            </span>
          ))}
        </div>
      )}

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
                  {g.ended_at && (
                    <> → {new Date(g.ended_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</>
                  )}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function DailyBoard({ todayGames, totalMinToday, allGames }) {
  const todayKey = gameToDateKey(new Date())
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [calOpen, setCalOpen] = useState(false)
  const countdown = useResetCountdown()

  const gamesByDay = useMemo(() => {
    const map = {}
    for (const g of allGames) {
      const key = gameToDateKey(g.started_at)
      if (!map[key]) map[key] = []
      map[key].push(g)
    }
    return map
  }, [allGames])

  const selectedGames = gamesByDay[selectedKey] || []
  const isToday = selectedKey === todayKey

  function handleSelectDay(key) {
    setSelectedKey(key)
    setCalOpen(false)
  }

  return (
    <div className={styles.board}>
      <div className={styles.header}>
        <div className={styles.title}>DAILY BOARD</div>
        <button
          className={`${styles.calToggle} ${calOpen ? styles.calToggleActive : ""}`}
          onClick={() => setCalOpen(o => !o)}
        >
          Calendrier
        </button>
      </div>

      {calOpen && (
        <Calendar
          allGames={allGames}
          selectedKey={selectedKey}
          onSelect={handleSelectDay}
        />
      )}

      <DayDetail
        dateKey={selectedKey}
        games={selectedGames}
        isToday={isToday}
        countdown={countdown}
      />
    </div>
  )
}