import type { FormState, WorkRow } from '../../types'
import { WORK_TYPES, type Channel } from '../../data/team'
import { Chip } from '../ui/Chip'
import { TextInput, TextArea } from '../ui/TextInput'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

export function WorkZone({ value, onChange }: Props) {
  const work = value.work

  const updateWork = (patch: Partial<WorkRow>) => {
    onChange({ work: { ...work, ...patch } })
  }

  const categories = work.channel ? Object.keys(WORK_TYPES[work.channel]) : []
  const levels =
    work.channel && work.category
      ? (WORK_TYPES[work.channel] as Record<string, readonly string[]>)[work.category] ?? []
      : []

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>작업</h2>
        <p className={styles.subtitle}>
          온/오프 → 종류 → 난이도 순으로 선택. 소재가 여러 개면 다음 단계에서 [+] 복제 예정.
        </p>
      </header>

      <div className={styles.body}>
        {/* 온/오프 */}
        <div>
          <span className={styles.fieldLabel}>온/오프</span>
          <div className={styles.chips}>
            {(['online', 'offline'] as Channel[]).map((c) => (
              <Chip
                key={c}
                label={c === 'online' ? '온라인' : '오프라인'}
                selected={work.channel === c}
                onClick={() => updateWork({ channel: c, category: '', level: '' })}
              />
            ))}
          </div>
        </div>

        {/* 종류 (온/오프 선택 후 노출) */}
        {work.channel && (
          <div>
            <span className={styles.fieldLabel}>종류</span>
            <div className={styles.chips}>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={work.category === cat}
                  onClick={() => updateWork({ category: cat, level: '' })}
                />
              ))}
            </div>
          </div>
        )}

        {/* 난이도 (종류 선택 후, 난이도가 있는 종류만 노출) */}
        {work.channel && work.category && levels.length > 0 && (
          <div>
            <span className={styles.fieldLabel}>난이도</span>
            <div className={styles.chips}>
              {levels.map((lv) => (
                <Chip
                  key={lv}
                  label={lv}
                  selected={work.level === lv}
                  onClick={() => updateWork({ level: lv })}
                />
              ))}
            </div>
          </div>
        )}

        {/* 수량 */}
        <TextInput
          type="number"
          label="수량"
          placeholder="숫자만"
          inputMode="numeric"
          min={1}
          value={work.quantity}
          onChange={(e) => updateWork({ quantity: e.target.value })}
        />

        {/* 비고 (소재별) */}
        <TextArea
          label="비고"
          placeholder="이 소재만의 특이사항 (선택)"
          value={work.note}
          onChange={(e) => updateWork({ note: e.target.value })}
        />
      </div>
    </section>
  )
}
