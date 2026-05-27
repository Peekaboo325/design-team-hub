import { GAS_URL } from './config'
import type { FormState } from './types'

// hub-api.gs의 createSchedule 응답 형식
export type CreateScheduleResult =
  | { ok: true; rowsCreated: number; ids: string[] }
  | { ok?: false; error: string; code?: string; stack?: string }

// 중복 의심 행 한 건 (check-duplicates 응답에 N개)
export type DuplicateMatch = {
  id: string
  advertiser: string
  requester: string
  designer: string
  category: string
  note: string         // J열 셀 값 = 작업 내용
  mailTitle: string    // J열 셀 메모의 첫 줄
}

export type CheckDuplicatesResult =
  | { matches: DuplicateMatch[] }
  | { error: string }

// GAS Web App에 POST. BUSY 응답이면 지수 backoff로 재시도 (max 2회).
// CORS 회피를 위해 Content-Type 미지정 (GAS는 e.postData.contents로 raw 받음).
async function postWithBusyRetry<T>(body: unknown, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    const data = (await res.json()) as { code?: string }
    // BUSY면 다른 등록이 lock 잡고 있는 중 → 잠시 대기 후 재시도
    if (data.code === 'BUSY' && attempt < maxRetries) {
      const delay = 500 * Math.pow(3, attempt)  // 500ms, 1500ms
      await new Promise((r) => setTimeout(r, delay))
      continue
    }
    return data as T
  }
  // 여기에 닿으면 BUSY로 max retries 소진
  return { code: 'BUSY', error: '여러 명이 동시에 등록 중입니다. 잠시 후 다시 시도해주세요.' } as T
}

export async function createSchedule(form: FormState): Promise<CreateScheduleResult> {
  return postWithBusyRetry<CreateScheduleResult>({ action: 'create', form })
}

// 메일 제목으로 시트에서 비슷한 의뢰가 이미 등록돼 있는지 검사.
// 정규화(공백·괄호·구두점·대소문자 무시) 후 substring 매칭.
// 빈 제목이면 fetch 없이 빈 결과 즉시 반환.
// 읽기 전용이라 BUSY 발생 안 함 — 재시도 X.
export async function checkDuplicates(mailTitle: string): Promise<CheckDuplicatesResult> {
  if (!mailTitle.trim()) return { matches: [] }
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'check-duplicates', mailTitle }),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return res.json()
}
