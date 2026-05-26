import { useState, useRef, useEffect } from 'react'
import styles from './Dropdown.module.css'

type Props = {
  value: string
  options: readonly string[]
  onChange: (next: string) => void
  // 옵션 리스트 맨 위에 표시할 '선택 안 함' 라벨. 지정 시 빈 값으로 초기화하는 옵션 노출.
  emptyLabel?: string
  ariaLabel?: string
}

// 토스 톤 드롭다운 — TextInput과 동일한 외형의 트리거 + 팝오버 옵션 리스트.
export function Dropdown({ value, options, onChange, emptyLabel, ariaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const triggerCls = [styles.trigger, open ? styles.open : ''].filter(Boolean).join(' ')

  const pick = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className={styles.field} ref={ref}>
      <button
        type="button"
        className={triggerCls}
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
      >
        <span className={styles.triggerText}>{value || ' '}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className={styles.popover}>
          {emptyLabel !== undefined && (
            <button
              type="button"
              className={[styles.option, !value ? styles.optionSelected : ''].filter(Boolean).join(' ')}
              onClick={() => pick('')}
            >
              {emptyLabel}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={[styles.option, value === opt ? styles.optionSelected : ''].filter(Boolean).join(' ')}
              onClick={() => pick(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.15s ease',
        color: 'var(--color-text-tertiary)',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
