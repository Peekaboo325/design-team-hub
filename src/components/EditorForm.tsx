import { useState } from 'react'
import { INITIAL_FORM_STATE, type FormState } from '../types'
import { MailZone } from './zones/MailZone'
import { AuthorZone } from './zones/AuthorZone'
import { DeadlineZone } from './zones/DeadlineZone'
import { WorkZone } from './zones/WorkZone'
import { Button } from './ui/Button'
import styles from './EditorForm.module.css'

export function EditorForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE)

  // 부분 갱신 헬퍼 — 각 존이 자기 필드만 patch해서 올림
  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }))

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>스케줄 등록</h1>
        <p className={styles.pageDesc}>
          새 스케줄 한 건을 등록합니다. (1단계 — 아직 시트에 쓰이지 않음)
        </p>
      </header>

      <div className={styles.zones}>
        <MailZone value={form} onChange={patch} />
        <AuthorZone value={form} onChange={patch} />
        <DeadlineZone value={form} onChange={patch} />
        <WorkZone value={form} onChange={patch} />
      </div>

      <footer className={styles.footer}>
        <Button variant="secondary" onClick={() => setForm(INITIAL_FORM_STATE)}>
          초기화
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            // 1단계 — 등록 동작 없음. 다음 단계(미리보기)에서 채움.
            console.log('FORM STATE:', form)
            alert('1단계 골격입니다. 등록 동작은 다음 단계에서 붙입니다.')
          }}
        >
          등록
        </Button>
      </footer>
    </div>
  )
}
