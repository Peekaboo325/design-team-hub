import { useEffect, useMemo, useState } from 'react'
import {
  EMPTY_GROUP,
  EMPTY_MATERIAL,
  INITIAL_FORM_STATE,
  isFormValid,
  normalizeFormForSubmit,
  validateForm,
  type FormState,
} from '../types'
import { createSchedule } from '../api'
import { AuthorZone } from './zones/AuthorZone'
import { DeadlineZone } from './zones/DeadlineZone'
import { WorkZone } from './zones/WorkZone'
import { Button } from './ui/Button'
import styles from './EditorForm.module.css'

// localStorage 키 — 자료 모델 바뀌면 버전 올려 옛 데이터 자동 무시
// v2: Material에 id 필드 추가 (2026-05-26)
const STORAGE_KEY = 'design-team-hub.form-draft.v2'

function loadDraft(): FormState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return freshInitialState()
    const parsed = JSON.parse(saved) as FormState
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.groups) &&
      parsed.groups.every((g) => g && Array.isArray(g.materials))
    ) {
      return parsed
    }
  } catch {
    // ignore
  }
  return freshInitialState()
}

// 매번 fresh 객체로 초기화 (참조 공유 방지)
function freshInitialState(): FormState {
  return {
    ...INITIAL_FORM_STATE,
    groups: [{ ...EMPTY_GROUP, materials: [{ ...EMPTY_MATERIAL }] }],
  }
}

type Feedback = { kind: 'ok' | 'error'; message: string } | null

export function EditorForm() {
  const [form, setForm] = useState<FormState>(() => loadDraft())
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  // 폼 변경 시 디바운스(500ms) localStorage 저장
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
      } catch {
        // ignore
      }
    }, 500)
    return () => clearTimeout(handle)
  }, [form])

  const patch = (p: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...p }))
    if (feedback) setFeedback(null)  // 사용자가 다시 수정하면 이전 피드백 클리어
  }

  const validation = useMemo(() => validateForm(form), [form])
  const canSubmit = isFormValid(validation) && !submitting

  const handleReset = () => {
    setForm(freshInitialState())
    setFeedback(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setFeedback(null)
    try {
      const normalized = normalizeFormForSubmit(form)
      const result = await createSchedule(normalized)
      if (result.ok) {
        setFeedback({
          kind: 'ok',
          message: `등록 완료 — ${result.rowsCreated}행 추가됨`,
        })
        // 성공 시 폼 초기화 + localStorage 비움
        setForm(freshInitialState())
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
      } else {
        setFeedback({
          kind: 'error',
          message: result.error || '알 수 없는 에러',
        })
      }
    } catch (err) {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : '네트워크 오류',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>스케줄 등록</h1>
        <p className={styles.pageDesc}>새 스케줄 한 건을 등록합니다.</p>
      </header>

      <div className={styles.zones}>
        <AuthorZone value={form} onChange={patch} validation={validation} />
        <DeadlineZone value={form} onChange={patch} validation={validation} />
        <WorkZone value={form} onChange={patch} validation={validation} />
      </div>

      {feedback && (
        <div
          className={`${styles.feedback} ${
            feedback.kind === 'ok' ? styles.feedbackOk : styles.feedbackError
          }`}
        >
          {feedback.message}
        </div>
      )}

      <footer className={styles.footer}>
        {/* 초기화는 등록과 멀리 떨어진 좌측, 가장 약한 톤(ghost)으로. */}
        <Button variant="ghost" onClick={handleReset} disabled={submitting}>
          초기화
        </Button>
        <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? '등록 중...' : '등록'}
        </Button>
      </footer>
    </div>
  )
}
