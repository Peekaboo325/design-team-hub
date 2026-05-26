import { WORK_TYPES, type Channel } from './data/team'

// 소재 한 줄 — 같은 종류·상세 안에서 수량·작업내용·디자이너는 소재마다 다를 수 있음.
export type Material = {
  quantity: string                // 수량 (텍스트로 보유, 등록 시 숫자 변환)
  note: string                    // 작업 내용 (시트 컬럼명은 '비고')
  designer: string                // 배정 디자이너 ('' = 미배정. 팀장이 나중 배정 가능)
  id: string                      // 행 식별자. 폼 작성 중엔 '' (등록 정규화 시 부여됨)
}

// 종류 그룹 — 한 메일 안에 여러 종류가 섞일 수 있음 (예: 배너 3개 + KV 1개).
// 한 그룹은 (채널·종류·상세) 공통 + 소재 N개.
export type Group = {
  channel: Channel | null
  category: string                // 종류 (예: 'KV')
  detail: string                  // 상세 (예: '베이직'). 상세 없는 종류는 ''
  materials: Material[]
}

// 폼 전체 상태
export type FormState = {
  // 메일
  mailTitle: string
  mailNote: string

  // 작성자
  advertiser: string              // ADVERTISERS 중 하나 또는 직접 입력값
  advertiserIsCustom: boolean
  team: string                    // TEAMS 중 하나 또는 직접 입력값
  teamIsCustom: boolean
  requester: string               // REQUESTERS[team] 중 하나 또는 직접 입력값
  requesterIsCustom: boolean

  // 일정
  requestDate: string             // YYYY-MM-DD (기본: 오늘)
  deadline: string                // YYYY-MM-DD

  // 작업 — 종류 그룹 N개 (보통 1개, 한 메일에 여러 종류가 섞이면 2~)
  groups: Group[]
}

export const EMPTY_MATERIAL: Material = {
  quantity: '1',                  // 대부분의 의뢰가 수량 1로 시작
  note: '',
  designer: '',                   // 미배정 — 등록 후 팀장이 배정할 수도 있음
  id: '',                         // 등록 정규화 단계에서 batchId 기반으로 부여
}

export const EMPTY_GROUP: Group = {
  channel: 'online',              // 기본 온라인 (오프라인은 1-2회/년)
  category: '',
  detail: '',
  materials: [{ ...EMPTY_MATERIAL }],
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

// 비영업일 여부 (토/일 + 공휴일)
function isNonBusinessDay(d: Date, holidays: readonly string[]): boolean {
  if (isWeekend(d)) return true
  return holidays.includes(ymd(d))
}

// 비영업일이면 다음 영업일로 굴림 (in-place)
function rollToNextBusinessDay(d: Date, holidays: readonly string[]): void {
  while (isNonBusinessDay(d, holidays)) {
    d.setDate(d.getDate() + 1)
  }
}

// 기준일에서 N영업일 뒤 (기준일 비어있으면 오늘 기준).
// 기준일이 비영업일이면 먼저 다음 영업일로 굴린 후 N영업일 추가.
// 추가 중 만나는 토/일/공휴일은 카운트하지 않고 건너뜀.
// days=0이면 기준일을 영업일로 정규화만 반환.
export function addBusinessDays(
  baseDate: string,
  days: number,
  holidays: readonly string[] = [],
): string {
  const d = baseDate ? new Date(baseDate) : new Date()
  rollToNextBusinessDay(d, holidays)
  let remaining = days
  while (remaining > 0) {
    d.setDate(d.getDate() + 1)
    if (!isNonBusinessDay(d, holidays)) {
      remaining--
    }
  }
  return ymd(d)
}

// 한글 요일 표기 — YYYY-MM-DD → '월'~'일' 한 글자
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const
export function weekdayKo(ymdStr: string): string {
  if (!ymdStr) return ''
  const [y, m, day] = ymdStr.split('-').map(Number)
  if (!y || !m || !day) return ''
  return WEEKDAY_KO[new Date(y, m - 1, day).getDay()]
}

// 작업 내용의 숫자 +1로 증가. 0 padding 유지.
// 대상: 문자열 끝 또는 닫는 괄호들 직전의 숫자.
// 괄호 안 내용은 매칭 그룹에 안 들어가므로 절대 안 바뀜.
//
//   '메타01'              → '메타02'
//   '메타09'              → '메타10'
//   '메타01(1080x1080)'   → '메타02(1080x1080)'  (괄호 안은 그대로)
//   '메타01(260601)'      → '메타02(260601)'
//   '메타01(1080)(추가)'  → '메타02(1080)(추가)' (괄호 여러 개도 OK)
//   '메타_시안'           → '메타_시안' (끝이 텍스트라 매칭 X)
//   '01번째메타'          → '01번째메타' (숫자가 가운데, 끝이 텍스트)
export function incrementTrailingNumber(s: string): string {
  const match = s.match(/^(.*?)(\d+)((?:\([^)]*\))*)$/)
  if (!match) return s
  const [, prefix, numStr, trailing] = match
  const next = String(parseInt(numStr, 10) + 1).padStart(numStr.length, '0')
  return prefix + next + trailing
}

// ─────────────────────────────────────────────
// 검증 — 필수 항목 정의.
// 필수: 팀 / 광고주 / 마감일 / (그룹별) 종류 / 상세(상세 옵션이 있는 종류일 때만)
// 선택: 메일 제목·비고 / 요청자 / 디자이너 / 작업 내용
// 자동 채움 (정규화 시): 수량(빈값 → '1'), 작업 내용(빈값 → '미정')
// ─────────────────────────────────────────────
export type Validation = {
  team: boolean
  advertiser: boolean
  deadline: boolean
  groups: { category: boolean; detail: boolean }[]
}

export function validateForm(form: FormState): Validation {
  return {
    team: !!form.team,
    advertiser: !!form.advertiser,
    deadline: !!form.deadline,
    groups: form.groups.map((g) => {
      const detailOptions =
        g.channel && g.category
          ? (WORK_TYPES[g.channel] as Record<string, readonly string[]>)[g.category] ?? []
          : []
      const detailRequired = detailOptions.length > 0
      return {
        category: !!g.category,
        detail: !detailRequired || !!g.detail,
      }
    }),
  }
}

export function isFormValid(v: Validation): boolean {
  if (!v.team || !v.advertiser || !v.deadline) return false
  return v.groups.every((g) => g.category && g.detail)
}

// 8자 hex batch 식별자 — 한 폼 = 한 batch.
// crypto.randomUUID()의 첫 8자만 사용 (충돌 확률 ≈ 1/4억).
function generateBatchId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  }
  // 환경 fallback
  return Math.random().toString(16).slice(2, 10).padEnd(8, '0').toUpperCase()
}

// 등록·시트 쓰기 직전 정규화 — 빈 값 fallback + 행 ID 부여.
//   작업 내용 빈 값 → '미정'
//   수량 빈 값 → '1'
//   ID → 'b{batchId}-{rowIdx}' (그룹·소재 flatten 순번, batch 단위로 prefix 공유)
//
// 이 함수가 ID 발급의 단일 진실 원천. GAS는 빈 L열에만 자동발급하므로 우리 ID 안 덮어씀.
// 향후 입력 폼이 일원화되면 GAS의 자동발급 로직(Scheduler.assignIdIfNeeded_,
// widget-api GET 백필, Sync migrate)은 redundant — 정리 검토 대상.
export function normalizeFormForSubmit(form: FormState): FormState {
  const batchId = generateBatchId()
  let rowIdx = 0
  return {
    ...form,
    groups: form.groups.map((g) => ({
      ...g,
      materials: g.materials.map((m) => {
        rowIdx += 1
        return {
          ...m,
          quantity: m.quantity.trim() || '1',
          note: m.note.trim() || '미정',
          id: `b${batchId}-${String(rowIdx).padStart(3, '0')}`,
        }
      }),
    })),
  }
}

export const INITIAL_FORM_STATE: FormState = {
  mailTitle: '',
  mailNote: '',
  advertiser: '',
  advertiserIsCustom: false,
  team: '',
  teamIsCustom: false,
  requester: '',
  requesterIsCustom: false,
  requestDate: today(),
  deadline: '',
  groups: [{ ...EMPTY_GROUP, materials: [{ ...EMPTY_MATERIAL }] }],
}
