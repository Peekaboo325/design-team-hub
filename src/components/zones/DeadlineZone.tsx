import type { FormState } from '../../types'
import { addDays, today } from '../../types'
import { TextInput } from '../ui/TextInput'
import { Chip } from '../ui/Chip'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

// 마감일 빠른 선택 옵션 — 접수일 기준 +N일.
// '오늘'은 N=0이 아니라 오늘 날짜 자체로 세팅 (접수일과 무관).
const QUICK_OPTIONS: { label: string; days: number | 'today' }[] = [
  { label: '오늘', days: 'today' },
  { label: '+1일', days: 1 },
  { label: '+3일', days: 3 },
  { label: '+7일', days: 7 },
  { label: '+14일', days: 14 },
]

export function DeadlineZone({ value, onChange }: Props) {
  const setDeadline = (option: (typeof QUICK_OPTIONS)[number]) => {
    const next =
      option.days === 'today' ? today() : addDays(value.requestDate, option.days)
    onChange({ deadline: next })
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>일정</h2>
        <p className={styles.subtitle}>
          접수일은 기본 오늘. 마감일은 캘린더에서 직접 고르거나 우측 빠른 선택(접수일 기준).
        </p>
      </header>

      <div className={styles.deadlineSplit}>
        <div className={styles.deadlineDates}>
          <TextInput
            type="date"
            label="접수일"
            value={value.requestDate}
            onChange={(e) => onChange({ requestDate: e.target.value })}
          />
          <TextInput
            type="date"
            label="마감일"
            value={value.deadline}
            onChange={(e) => onChange({ deadline: e.target.value })}
          />
        </div>

        <div className={styles.deadlineQuick}>
          <span className={styles.fieldLabel}>마감일 빠른 선택</span>
          <div className={styles.chips}>
            {QUICK_OPTIONS.map((opt) => (
              <Chip key={opt.label} label={opt.label} onClick={() => setDeadline(opt)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
