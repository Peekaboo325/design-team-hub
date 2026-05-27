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
import { createSchedule, type DuplicateMatch } from '../api'
import { AuthorZone } from './zones/AuthorZone'
import { DeadlineZone } from './zones/DeadlineZone'
import { WorkZone } from './zones/WorkZone'
import { Button } from './ui/Button'
import styles from './EditorForm.module.css'

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
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [lastFailedForm, setLastFailedForm] = useState<FormState | null>(null)

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
    if (feedback) setFeedback(null)
  }

  const validation = useMemo(() => validateForm(form), [form])
  const canSubmit = isFormValid(validation) && !submitting

  const handleReset = () => {
    setForm(freshInitialState())
    setFeedback(null)
    setDuplicates([])
    setLastFailedForm(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  // Optimistic — 클릭 즉시 폼 초기화 + 화면 상단으로 스크롤.
  // 메시지는 응답 후에 한 번만 (성공/실패).
  const handleSubmit = async () => {
    if (!canSubmit) return

    const snapshot = form
    const normalized = normalizeFormForSubmit(snapshot)

    // 즉시 — 폼 초기화 + 이전 메시지 클리어 + 위로 스크롤
    setForm(freshInitialState())
    setDuplicates([])
    setLastFailedForm(null)
    setFeedback(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setSubmitting(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // 백그라운드 fetch — 응답 시점에 메시지 한 번만 표시
    try {
      const result = await createSchedule(normalized)
      if (result.ok) {
        setFeedback({
          kind: 'ok',
          message: `✓ 등록 완료 — ${result.rowsCreated}행 추가됨`,
        })
      } else {
        setFeedback({
          kind: 'error',
          message: `등록 실패: ${result.error || '알 수 없는 에러'}`,
        })
        setLastFailedForm(snapshot)
      }
    } catch (err) {
      setFeedback({
        kind: 'error',
        message: `네트워크 오류: ${err instanceof Error ? err.message : '응답 없음'}`,
      })
      setLastFailedForm(snapshot)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestore = () => {
    if (!lastFailedForm) return
    setForm(lastFailedForm)
    setLastFailedForm(null)
    setFeedback(null)
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>스케줄 등록</h1>
        <p className={styles.pageDesc}>새 스케줄 한 건을 등록합니다.</p>
      </header>

      {/* 등록 결과 피드백 — 위로 스크롤된 사용자 시야에 보이도록 헤더 바로 아래 */}
      {feedback && (
        <div
          className={`${styles.feedback} ${
            feedback.kind === 'ok' ? styles.feedbackOk : styles.feedbackError
          }`}
        >
          <span>{feedback.message}</span>
          {feedback.kind === 'error' && lastFailedForm && (
            <button type="button" className={styles.restoreBtn} onClick={handleRestore}>
              복원
            </button>
          )}
        </div>
      )}

      <div className={styles.zones}>
        <AuthorZone
          value={form}
          onChange={patch}
          validation={validation}
          duplicates={duplicates}
          onDuplicatesChange={setDuplicates}
        />
        <DeadlineZone value={form} onChange={patch} validation={validation} />
        <WorkZone value={form} onChange={patch} validation={validation} />
      </div>

      {duplicates.length > 0 && (
        <div className={styles.dupBanner}>
          ⚠ 메일 제목이 동일한 업무 요청 {duplicates.length}건이 등록되어 있습니다. 신규 등록하시겠습니까?
        </div>
      )}

      <footer className={styles.footer}>
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
