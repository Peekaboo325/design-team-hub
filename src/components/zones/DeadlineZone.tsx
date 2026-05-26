import type { FormState } from '../../types'
import { addBusinessDays, weekdayKo } from '../../types'
import { HOLIDAYS } from '../../data/team'
import { DatePicker } from '../ui/DatePicker'
import { Chip } from '../ui/Chip'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

// 마감일 빠른 선택 — 모두 접수일 기준 N영업일 뒤(토/일/공휴일 자동 스킵).
// '당일'은 N=0 — 접수일이 비영업일이면 다음 영업일로 자동 굴림.
const QUICK_OPTIONS: { label: string; days: number }[] = [
  { label: '당일', days: 0 },
  { label: '+1일', days: 1 },
  { label: '+2일', days: 2 },
  { label: '+3일', days: 3 },
  { label: '+4일', days: 4 },
]

export function DeadlineZone({ value, onChange }: Props) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>일정 정보</h2>
        <p className={styles.subtitle}>
          접수일은 기본 오늘. 마감일은 캘린더에서 직접 고르거나 우측 빠른 선택(접수일 기준, 영업일).
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
            disabledBefore={value.requestDate}
          />
        </div>

        <div className={styles.deadlineQuick}>
          <span className={styles.fieldLabel}>마감일 빠른 선택</span>
          <div className={styles.chips}>
            {QUICK_OPTIONS.map((opt) => {
              // 각 칩이 실제로 어떤 날짜·요일로 떨어질지 미리 계산해서 라벨에 노출
              const target = addBusinessDays(value.requestDate, opt.days, HOLIDAYS)
              const day = weekdayKo(target)
              return (
                <Chip
                  key={opt.label}
                  label={`${opt.label}(${day})`}
                  className={styles.quickChip}
                  onClick={() => onChange({ deadline: target })}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
