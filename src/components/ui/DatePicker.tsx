import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { ko } from 'date-fns/locale'
import 'react-day-picker/style.css'
import { weekdayKo } from '../../types'
import styles from './DatePicker.module.css'

type Props = {
  label?: string
  value: string                    // YYYY-MM-DD ('' 가능)
  onChange: (next: string) => void
  holidays?: readonly string[]     // YYYY-MM-DD 배열
  disabledBefore?: string          // YYYY-MM-DD. 이 날짜 이전(미포함)은 선택 불가
  placeholder?: string             // 빈 값일 때 trigger에 표시할 회색 안내 텍스트
  required?: boolean               // 라벨 옆에 빨간 dot 표시 (미입력 안내)
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
// 일요일 시작(한국 캘린더 관습). 토(파랑) / 일·공휴일(빨강) 색칠.
export function DatePicker({
  label,
  value,
  onChange,
  holidays = [],
  disabledBefore,
  placeholder,
  required,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
  const disabledBeforeDate = disabledBefore ? parseYmd(disabledBefore) : undefined

  const triggerCls = [styles.trigger, open ? styles.open : ''].filter(Boolean).join(' ')

  return (
    <div className={styles.field} ref={containerRef}>
      {label && (
        <span className={styles.label}>
          {label}
          {required && <span className={styles.requiredDot} aria-label="필수" />}
        </span>
      )}
      <button
        type="button"
        className={triggerCls}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={[styles.triggerText, !value && placeholder ? styles.triggerPlaceholder : '']
            .filter(Boolean)
            .join(' ')}
        >
          {value ? `${value} (${weekdayKo(value)})` : placeholder || ' '}
        </span>
        <CalendarIcon />
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
            weekStartsOn={0}
            disabled={disabledBeforeDate ? { before: disabledBeforeDate } : undefined}
            modifiers={{
              saturday: (date: Date) => date.getDay() === 6,
              sunday: (date: Date) => date.getDay() === 0,
              holiday: (date: Date) => holidaySet.has(ymd(date)),
            }}
            modifiersClassNames={{
              saturday: styles.saturday,
              sunday: styles.sunday,
              holiday: styles.holiday,
              today: styles.todayPlain,        // 사용자 요청: 오늘 강조 X
              selected: styles.selectedFilled, // 선택만 채운 파란 원으로
            }}
          />
        </div>
      )}
    </div>
  )
}

// 달력 아이콘 — 인라인 SVG (의존성 X)
function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
