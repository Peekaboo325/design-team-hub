import { useEffect, useMemo, useState } from 'react'
import {
  INITIAL_FORM_STATE,
  isFormValid,
  normalizeFormForSubmit,
  validateForm,
  type FormState,
} from '../types'
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
    if (!saved) return INITIAL_FORM_STATE
    const parsed = JSON.parse(saved) as FormState
    // 형식 점검 — 깨진 데이터면 무시
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.groups) &&
      parsed.groups.every((g) => g && Array.isArray(g.materials))
    ) {
      return parsed
    }
  } catch {
    // ignore (JSON parse 실패 / 접근 불가 등)
  }
  return INITIAL_FORM_STATE
}

export function EditorForm() {
  const [form, setForm] = useState<FormState>(() => loadDraft())

  // 폼 변경 시 디바운스(500ms) localStorage 저장
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
      } catch {
        // ignore (quota exceeded 등)
      }
    }, 500)
    return () => clearTimeout(handle)
  }, [form])

  // 부분 갱신 헬퍼 — 각 존이 자기 필드만 patch해서 올림
  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }))

  // 검증 — 매 렌더마다 form 기준으로 계산. 빈 필수 필드를 각 Zone에 알려서 dot 표시.
  const validation = useMemo(() => validateForm(form), [form])
  const canSubmit = isFormValid(validation)

  const handleReset = () => {
    setForm(INITIAL_FORM_STATE)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    // '미정'·기본 수량 fallback 적용 후 출력. 시트 쓰기 단계에서 그대로 사용 예정.
    const normalized = normalizeFormForSubmit(form)
    console.log('FORM (정규화):', normalized)
    alert('검증 통과. 시트 쓰기는 다음 단계에서.')
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>스케줄 등록</h1>
        <p className={styles.pageDesc}>
          새 스케줄 한 건을 등록합니다. (1단계 — 아직 시트에 쓰이지 않음)
        </p>
      </header>

      <div className={styles.zones}>
        <AuthorZone value={form} onChange={patch} validation={validation} />
        <DeadlineZone value={form} onChange={patch} validation={validation} />
        <WorkZone value={form} onChange={patch} validation={validation} />
      </div>

      <footer className={styles.footer}>
        {/* 초기화는 등록과 멀리 떨어진 좌측, 가장 약한 톤(ghost)으로. */}
        <Button variant="ghost" onClick={handleReset}>
          초기화
        </Button>
        <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
          등록
        </Button>
      </footer>
    </div>
  )
}
