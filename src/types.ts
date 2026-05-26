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

// 토/일 여부
function isWeekend(d: Date): boolean {
  const dow = d.getDay()
  return dow === 0 || dow === 6  // 0=일, 6=토
}

// 주말이면 다음 평일로 굴림 (in-place)
function rollToNextBusinessDay(d: Date): void {
  while (isWeekend(d)) {
    d.setDate(d.getDate() + 1)
  }
}

// 오늘이지만 영업일이 아니면 그다음 영업일
export function todayBusinessDay(): string {
  const d = new Date()
  rollToNextBusinessDay(d)
  return ymd(d)
}

// 기준일에서 N영업일 뒤 (기준일 비어있으면 오늘 기준).
// 기준일이 주말이면 먼저 다음 영업일로 굴린 후 N영업일 추가.
export function addBusinessDays(baseDate: string, days: number): string {
  const d = baseDate ? new Date(baseDate) : new Date()
  rollToNextBusinessDay(d)
  let remaining = days
  while (remaining > 0) {
    d.setDate(d.getDate() + 1)
    if (!isWeekend(d)) {
      remaining--
    }
  }
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
