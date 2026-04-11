import { useEffect, useState } from 'react'
import styles from './PollProgress.module.css'

export default function PollProgress({ interval, lastChecked }) {
  const [key, setKey] = useState(0)

  useEffect(() => {
    setKey(k => k + 1)
  }, [lastChecked])

  if (!lastChecked) return null

  return (
    <div className={styles.track}>
      <div
        key={key}
        className={styles.bar}
        style={{ animationDuration: `${interval}s` }}
      />
    </div>
  )
}
