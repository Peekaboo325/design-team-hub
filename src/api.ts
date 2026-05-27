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

// GAS hub-api.gs의 action='create' endpoint 호출.
//
// CORS 회피:
//   Content-Type 헤더를 박지 않음 → simple request로 분류돼 preflight(OPTIONS) 없음.
//   GAS는 e.postData.contents로 raw body string을 받아 JSON.parse 함.
export async function createSchedule(form: FormState): Promise<CreateScheduleResult> {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'create', form }),
    redirect: 'follow',
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// 메일 제목으로 시트에서 비슷한 의뢰가 이미 등록돼 있는지 검사.
// 정규화(공백·괄호·구두점·대소문자 무시) 후 substring 매칭.
// 빈 제목이면 fetch 없이 빈 결과 즉시 반환.
export async function checkDuplicates(mailTitle: string): Promise<CheckDuplicatesResult> {
  if (!mailTitle.trim()) return { matches: [] }
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'check-duplicates', mailTitle }),
    redirect: 'follow',
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }
  return res.json()
}
