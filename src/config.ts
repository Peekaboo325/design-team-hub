// design-team-hub → GAS hub-api.gs Web App URL
// 재배포로 URL이 바뀌면 이 값만 갱신.
// DATA_CONTRACT.md §5 — GAS URL 운영 규칙 참조.
export const GAS_URL =
  'https://script.google.com/macros/s/AKfycbzAwiPT6PhxEqlxQ8WfPEFI4n8BniIyeo13jiYKPqAJpULMD5Os_llRlG4Sz7nRoWWJhg/exec'

// 시트 allowlist — GAS의 HUB_SHEET_ALLOWLIST와 반드시 일치 유지.
// 새 시트 추가 시 GAS와 여기 양쪽 갱신 필요.
export const SHEETS = {
  TEST: '💛신규·유지보수_TEST',
  PRODUCTION: '💛신규·유지보수',
} as const

export type SheetName = (typeof SHEETS)[keyof typeof SHEETS]

// 운영 전환 시점에 PRODUCTION으로 교체.
export const DEFAULT_SHEET: SheetName = SHEETS.TEST
