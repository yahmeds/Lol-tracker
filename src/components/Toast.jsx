import { useState, useEffect, useCallback } from 'react'
import styles from './Toast.module.css'

let toastFn = null

export function showToast(msg, type = 'info') {
  if (toastFn) toastFn(msg, type)
}

export default function Toast() {
  const [toasts, setToasts] = useState([])

  toastFn = useCallback((msg, type) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
