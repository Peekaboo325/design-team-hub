import type { FormState } from '../../types'
import { TextInput } from '../ui/TextInput'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

export function DeadlineZone({ value, onChange }: Props) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>일정</h2>
        <p className={styles.subtitle}>접수일은 기본 오늘. 마감일은 캘린더에서 선택.</p>
      </header>

      <div className={styles.row2}>
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
    </section>
  )
}
