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
  rowCount?: number    // 이 batch의 총 행 수 (>1이면 '외 다수' 표시)
}

export type CheckDuplicatesResult =
  | { matches: DuplicateMatch[] }
  | { error: string }

// GAS Web App에 POST. BUSY 응답이면 지수 backoff로 재시도 (max 2회).
// CORS 회피를 위해 Content-Type 미지정 (GAS는 e.postData.contents로 raw 받음).
// Cache-busting: URL에 timestamp 붙여 GAS Web App의 알려진 응답 캐싱 우회 시도.
async function postWithBusyRetry<T>(body: unknown, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const url = `${GAS_URL}?_=${Date.now()}-${attempt}`
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    const data = (await res.json()) as { code?: string }
    if (data.code === 'BUSY' && attempt < maxRetries) {
      const delay = 500 * Math.pow(3, attempt)
      await new Promise((r) => setTimeout(r, delay))
      continue
    }
    return data as T
  }
  return { code: 'BUSY', error: '여러 명이 동시에 등록 중입니다. 잠시 후 다시 시도해주세요.' } as T
}

export async function createSchedule(form: FormState): Promise<CreateScheduleResult> {
  return postWithBusyRetry<CreateScheduleResult>({ action: 'create', form })
}

// hub-api.gs v0.10 listSchedules 응답의 행 한 건
export type ScheduleRow = {
  row: number                // 시트 행번호 (편집 시 fallback)
  id: string
  type: string               // 일반 / 급건 / 여유
  team: string
  requester: string
  advertiser: string
  designer: string
  channel: string            // online / offline
  category: string           // '웹진형페이지' / '배너(GIF)' 등 종류(난이도)
  quantity: number | null
  note: string               // J열 셀 값 (작업 내용)
  mailTitle: string          // J열 메모 첫 문단
  mailNote: string           // J열 메모 두번째 문단~
  status: '예정' | '대기' | '진행' | '완료' | string
  shared: boolean
  receivedDate: string       // YYYY-MM-DD ('' = 색칠 없음)
  deadline: string           // YYYY-MM-DD ('' = 마감일 색칠 없음, 당일 급건 등)
}

export type ListSchedulesResult =
  | { ok: true; rows: ScheduleRow[]; sheetName: string; fetchedAt: string }
  | { ok?: false; error: string }

// 시트 데이터 전체 fetch — GET. 캐시 우회 timestamp.
export async function listSchedules(): Promise<ListSchedulesResult> {
  const url = `${GAS_URL}?action=list&_=${Date.now()}`
  const res = await fetch(url, { method: 'GET', redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return res.json()
}

// 메일 제목 중복 감지 — 읽기 전용. BUSY 안 발생. 캐시 우회 시도.
export async function checkDuplicates(mailTitle: string): Promise<CheckDuplicatesResult> {
  if (!mailTitle.trim()) return { matches: [] }
  const url = `${GAS_URL}?_=${Date.now()}`
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action: 'check-duplicates', mailTitle }),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return res.json()
}
