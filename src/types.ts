import type { Channel } from './data/team'

// 폼 한 줄 단위 상태 (메타 한 건. [+]로 복제될 때 이 단위가 늘어남)
// 1단계에선 한 줄만. [+] 복제는 §만드는 순서 6번에서.
export type WorkRow = {
  channel: Channel | null         // 온/오프
  category: string                // 종류 (예: 'KV')
  level: string                   // 난이도 (예: '베이직'). 난이도 없는 종류는 ''
  quantity: string                // 수량 (텍스트 상태로 보유, 등록 시 숫자 변환)
  note: string                    // 비고 (소재별)
}

// 폼 전체 상태
export type FormState = {
  // 메일 존
  mailTitle: string
  mailNote: string

  // 작성자 존
  advertiser: string | null
  team: string                    // TEAMS 중 하나 또는 직접 입력값
  teamIsCustom: boolean           // 직접 입력 모드 여부
  requester: string               // REQUESTERS[team] 중 하나 또는 직접 입력값
  requesterIsCustom: boolean

  // 마감일 존
  requestDate: string             // YYYY-MM-DD (기본: 오늘)
  deadline: string                // YYYY-MM-DD

  // 작업 존 — 1단계는 한 줄. [+]로 늘어날 때 배열로 확장 예정.
  work: WorkRow
}

export const EMPTY_WORK_ROW: WorkRow = {
  channel: null,
  category: '',
  level: '',
  quantity: '',
  note: '',
}

// YYYY-MM-DD 포맷터
function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 오늘 날짜 YYYY-MM-DD
export function today(): string {
  return ymd(new Date())
}

// 기준일에서 N일 뒤 (기준일 비어있으면 오늘 기준)
export function addDays(baseDate: string, days: number): string {
  const d = baseDate ? new Date(baseDate) : new Date()
  d.setDate(d.getDate() + days)
  return ymd(d)
}

export const INITIAL_FORM_STATE: FormState = {
  mailTitle: '',
  mailNote: '',
  advertiser: null,
  team: '',
  teamIsCustom: false,
  requester: '',
  requesterIsCustom: false,
  requestDate: today(),
  deadline: '',
  work: { ...EMPTY_WORK_ROW },
}
