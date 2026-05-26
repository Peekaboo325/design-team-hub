import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { ko } from 'date-fns/locale'
import 'react-day-picker/style.css'
import styles from './DatePicker.module.css'

type Props = {
  label?: string
  value: string                    // YYYY-MM-DD ('' 가능)
  onChange: (next: string) => void
  holidays?: readonly string[]     // YYYY-MM-DD 배열
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYmd(s: string): Date | undefined {
  if (!s) return undefined
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

// 토스 톤 캘린더 — react-day-picker v9 + 한국어 locale.
// 토(파랑) / 일(빨강) / 공휴일(빨강·굵게) 색칠.
export function DatePicker({ label, value, onChange, holidays = [] }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = parseYmd(value)
  const holidaySet = new Set(holidays)

  const triggerCls = [styles.trigger, open ? styles.open : ''].filter(Boolean).join(' ')

  return (
    <div className={styles.field} ref={containerRef}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        type="button"
        className={triggerCls}
        onClick={() => setOpen((o) => !o)}
      >
        {value || ' '}
      </button>
      {open && (
        <div className={styles.popover}>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(ymd(d))
                setOpen(false)
              }
            }}
            locale={ko}
            weekStartsOn={1}
            modifiers={{
              saturday: (date: Date) => date.getDay() === 6,
              sunday: (date: Date) => date.getDay() === 0,
              holiday: (date: Date) => holidaySet.has(ymd(date)),
              isToday: (date: Date) => {
                const t = new Date()
                return (
                  date.getFullYear() === t.getFullYear() &&
                  date.getMonth() === t.getMonth() &&
                  date.getDate() === t.getDate()
                )
              },
            }}
            modifiersClassNames={{
              saturday: styles.saturday,
              sunday: styles.sunday,
              holiday: styles.holiday,
              isToday: styles.todayCircle,
            }}
          />
        </div>
      )}
    </div>
  )
}
