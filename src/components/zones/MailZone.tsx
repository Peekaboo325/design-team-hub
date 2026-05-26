import type { FormState } from '../../types'
import { TextInput, TextArea } from '../ui/TextInput'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

export function MailZone({ value, onChange }: Props) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>메일</h2>
        <p className={styles.subtitle}>받은 메일의 제목과 메모. 시트 비고(J열) 셀 메모로 저장됨.</p>
      </header>

      <div className={styles.body}>
        <TextInput
          label="메일 제목"
          placeholder="예: [관절보궁] 5월 4주차 KV 시안 의뢰"
          value={value.mailTitle}
          onChange={(e) => onChange({ mailTitle: e.target.value })}
        />
        <TextArea
          label="메일 비고"
          placeholder="동일 제목 메일을 구분할 메모 (선택)"
          value={value.mailNote}
          onChange={(e) => onChange({ mailNote: e.target.value })}
        />
      </div>
    </section>
  )
}
