import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import styles from './StatsChart.module.css'

// ─── Build last 30 days buckets ───────────────────────────────────────────────

function buildChartData(allGames) {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const key = `${y}-${m}-${day}`
    days.push({
      date: d,
      dateStr: key,
      label: i === 0
        ? "Auj."
        : d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      shortLabel: i === 0
        ? "Auj."
        : d.toLocaleDateString("fr-FR", { weekday: "short" }),
      games: 0,
      minutes: 0,
    })
  }


  for (const g of allGames) {
    const gDate = g.started_at.slice(0, 10)
    const bucket = days.find(d => d.dateStr === gDate)
    if (bucket) {
      bucket.games += 1
      bucket.minutes += g.duration_min || 0
    }
  }
 
  return days
}


// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{d?.label}</div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipDot} style={{ background: 'var(--gold)' }} />
        <span>{d?.games} game{d?.games !== 1 ? 's' : ''}</span>
      </div>
      {d?.minutes > 0 && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: 'var(--cyan)' }} />
          <span>{Math.round(d.minutes / 60 * 10) / 10}h de jeu</span>
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsChart({ allGames }) {
  const data = buildChartData(allGames)
  const maxGames = Math.max(...data.map(d => d.games), 1)

  // Only show every ~5th label to avoid crowding
  const tickIndices = new Set([0, 6, 13, 20, 27, 29])

  const totalGames30 = data.reduce((a, d) => a + d.games, 0)
  const totalMin30   = data.reduce((a, d) => a + d.minutes, 0)
  const avgPerDay    = totalGames30 > 0
    ? (totalGames30 / data.filter(d => d.games > 0).length).toFixed(1)
    : 0

  const peakDay = data.reduce((best, d) => d.games > best.games ? d : best, { games: 0 })

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.title}>ACTIVITÉ — 30 JOURS</div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{totalGames30}</span>
          <span className={styles.summaryLabel}>games</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{Math.floor(totalMin30 / 60)}h</span>
          <span className={styles.summaryLabel}>de jeu</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{avgPerDay}</span>
          <span className={styles.summaryLabel}>moy/jour actif</span>
        </div>
        {peakDay.games > 0 && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{peakDay.games}</span>
            <span className={styles.summaryLabel}>record jour</span>
          </div>
        )}
      </div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barCategoryGap="20%" margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="shortLabel"
              tick={{ fill: 'var(--text-dim)', fontSize: 9, fontFamily: 'DM Mono' }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--text-dim)', fontSize: 9, fontFamily: 'DM Mono' }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="games" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.dateStr === new Date().toDateString()
                      ? 'var(--cyan)'
                      : entry.games === maxGames && entry.games > 0
                        ? 'var(--gold)'
                        : 'rgba(200,168,75,0.35)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--cyan)' }} />
          Aujourd'hui
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--gold)' }} />
          Record
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'rgba(200,168,75,0.35)' }} />
          Autres jours
        </span>
      </div>
    </div>
  )
}
