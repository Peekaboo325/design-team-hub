import { DEFAULT_SHEET, SHEETS, type SheetName } from './config'

// localStorage 기반 현재 시트 선택 — 테스트 기간용.
// 운영 전환 후엔 SheetPicker UI 제거 + DEFAULT_SHEET를 PRODUCTION으로 박으면 끝.
const LS_KEY = 'design-team-hub:currentSheet'

const VALID_SHEETS = Object.values(SHEETS) as SheetName[]

export function getCurrentSheet(): SheetName {
  if (typeof localStorage === 'undefined') return DEFAULT_SHEET
  const saved = localStorage.getItem(LS_KEY) as SheetName | null
  if (saved && VALID_SHEETS.includes(saved)) return saved
  return DEFAULT_SHEET
}

export function setCurrentSheet(sheet: SheetName): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LS_KEY, sheet)
}
