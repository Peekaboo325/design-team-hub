import type { FormState } from '../../types'
import { addBusinessDays, todayBusinessDay } from '../../types'
import { HOLIDAYS } from '../../data/team'
import { DatePicker } from '../ui/DatePicker'
import { Chip } from '../ui/Chip'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

// 마감일 빠른 선택 — 영업일 기준(토/일 + 공휴일 스킵).
// '당일'은 오늘(주말·공휴일이면 다음 영업일), '+N일'은 접수일 기준 N영업일 뒤.
const QUICK_OPTIONS: { label: string; days: number | 'today' }[] = [
  { label: '당일', days: 'today' },
  { label: '+1일', days: 1 },
  { label: '+2일', days: 2 },
  { label: '+3일', days: 3 },
  { label: '+4일', days: 4 },
]

export function DeadlineZone({ value, onChange }: Props) {
  const setDeadline = (option: (typeof QUICK_OPTIONS)[number]) => {
    const next =
      option.days === 'today'
        ? todayBusinessDay(HOLIDAYS)
        : addBusinessDays(value.requestDate, option.days, HOLIDAYS)
    onChange({ deadline: next })
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>일정 정보</h2>
        <p className={styles.subtitle}>
          접수일은 기본 오늘. 마감일은 캘린더에서 직접 고르거나 우측 빠른 선택(영업일 기준, 주말·공휴일 자동 스킵).
        </p>
      </header>

      <div className={styles.deadlineSplit}>
        <div className={styles.deadlineDates}>
          <DatePicker
            label="접수일"
            value={value.requestDate}
            onChange={(d) => onChange({ requestDate: d })}
            holidays={HOLIDAYS}
          />
          <DatePicker
            label="마감일"
            value={value.deadline}
            onChange={(d) => onChange({ deadline: d })}
            holidays={HOLIDAYS}
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
