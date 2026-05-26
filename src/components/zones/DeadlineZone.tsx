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
  { label: '+5일', days: 5 },
]

export function DeadlineZone({ value, onChange }: Props) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          일정 정보
          <span className={styles.titleCaption}>영업일 기반 계산</span>
        </h2>
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
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className={styles.deadlineQuick}>
          <span className={styles.fieldLabel}>마감일 빠른 선택</span>
          <div className={styles.chips}>
            {QUICK_OPTIONS.map((opt) => {
              // 각 칩이 실제로 어떤 날짜·요일로 떨어질지 미리 계산해서 라벨에 노출.
              // 사용자가 캘린더로 직접 마감일을 골랐어도, 그게 어떤 빠른 선택과
              // 일치하면 해당 칩에 자동 selected 표시 → 어느 옵션과 같은 날인지 즉시 인식.
              const target = addBusinessDays(value.requestDate, opt.days, HOLIDAYS)
              const day = weekdayKo(target)
              return (
                <Chip
                  key={opt.label}
                  label={`${opt.label}(${day})`}
                  selected={value.deadline === target}
                  className={styles.quickChip}
                  onClick={() => {
                    // 이미 그 날짜로 선택돼 있으면 해제 (빈 마감일로)
                    const isCurrent = value.deadline === target
                    onChange({ deadline: isCurrent ? '' : target })
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
