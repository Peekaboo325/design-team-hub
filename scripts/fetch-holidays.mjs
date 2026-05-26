// 한국 공휴일 자동 생성 — date-holidays + 한국 특화 보정.
//
// date-holidays는 KR 데이터가 부정확함:
//   - 누락: 근로자의 날(5/1), 설날·추석 ±1일 연휴, 대체휴일
//   - 잘못: 제헌절(7/17, 2008년 공휴일 폐지) 포함
// → 보정 로직으로 정확한 5년치 한국 법정 공휴일 생성.
//
// 매년 자동 갱신 (네트워크 불필요). 빌드 시점 기준 향후 5년치 미리 계산.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'
import Holidays from 'date-holidays'

const OUTPUT = 'src/data/holidays.generated.ts'

// 2008년 폐지된 제헌절은 제외
const EXCLUDE_NAMES = new Set(['제헌절'])

// 대체휴일 적용 대상 (일요일/토요일과 겹치면 다음 평일에 대체휴일).
// 어린이날·설날·추석은 토·일 모두, 나머지는 일요일만 대체 (현행 규정).
const SUBSTITUTE_SUNDAY_ONLY = new Set(['3·1절', '광복절', '개천절', '한글날', '석가탄신일'])
const SUBSTITUTE_SAT_AND_SUN = new Set(['어린이날'])

function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(date, n) {
  const r = new Date(date)
  r.setDate(r.getDate() + n)
  return r
}

function isWeekend(d) {
  const dow = d.getDay()
  return dow === 0 || dow === 6
}

// 주어진 날짜의 다음 평일 (이미 평일이면 그대로)
function rollToWeekday(d) {
  const r = new Date(d)
  while (isWeekend(r)) {
    r.setDate(r.getDate() + 1)
  }
  return r
}

function buildYearHolidays(year, allDates) {
  const hd = new Holidays('KR')
  const raw = hd.getHolidays(year) || []

  // 1. date-holidays public 결과 (제헌절 제외)
  const baseEntries = []
  for (const h of raw) {
    if (h.type !== 'public') continue
    if (EXCLUDE_NAMES.has(h.name)) continue
    const dateStr = String(h.date).slice(0, 10)
    allDates.add(dateStr)
    baseEntries.push({ name: h.name, date: new Date(dateStr) })
  }

  // 2. 근로자의 날 추가 (date-holidays는 'bank' 또는 누락)
  allDates.add(`${year}-05-01`)

  // 3. 설날 ±1일 연휴
  const seol = baseEntries.find((e) => e.name === '설날')
  if (seol) {
    allDates.add(ymd(addDays(seol.date, -1)))
    allDates.add(ymd(addDays(seol.date, 1)))
  }

  // 4. 추석 ±1일 연휴
  const chuseok = baseEntries.find((e) => e.name === '추석')
  if (chuseok) {
    allDates.add(ymd(addDays(chuseok.date, -1)))
    allDates.add(ymd(addDays(chuseok.date, 1)))
  }

  // 5. 대체휴일
  // 어린이날: 토·일과 겹치면 다음 평일
  // 3·1절·광복절·개천절·한글날·부처님오신날: 일요일과 겹치면 다음 월요일
  for (const { name, date } of baseEntries) {
    const dow = date.getDay()
    if (SUBSTITUTE_SAT_AND_SUN.has(name) && (dow === 0 || dow === 6)) {
      allDates.add(ymd(rollToWeekday(addDays(date, 1))))
    } else if (SUBSTITUTE_SUNDAY_ONLY.has(name) && dow === 0) {
      allDates.add(ymd(addDays(date, 1)))
    }
  }

  // 6. 설날·추석 연휴(3일 중 1일이라도 일요일이면) 대체휴일 = 연휴 마지막 평일 다음 영업일
  for (const event of [seol, chuseok]) {
    if (!event) continue
    const days = [-1, 0, 1].map((i) => addDays(event.date, i))
    const hasSunday = days.some((d) => d.getDay() === 0)
    if (hasSunday) {
      const lastDay = days[days.length - 1]
      const sub = rollToWeekday(addDays(lastDay, 1))
      allDates.add(ymd(sub))
    }
  }
}

function buildYears() {
  const current = new Date().getFullYear()
  return [current, current + 1, current + 2, current + 3, current + 4]
}

function buildAllDates() {
  const dates = new Set()
  for (const year of buildYears()) {
    buildYearHolidays(year, dates)
  }
  return [...dates].sort()
}

function generate(dates) {
  // Timestamp는 의도적으로 제외 — 데이터가 안 바뀌면 git diff도 안 생김.
  return `// AUTO-GENERATED — 직접 수정하지 말 것.
// Source: date-holidays npm + 한국 특화 보정 (scripts/fetch-holidays.mjs)
// Refresh: \`npm run fetch:holidays\` (빌드 시에도 자동 실행됨)

export const HOLIDAYS_AUTO: readonly string[] = [
${dates.map((d) => `  '${d}',`).join('\n')}
]
`
}

function writeEmptyIfMissing() {
  if (!existsSync(OUTPUT)) {
    mkdirSync(dirname(OUTPUT), { recursive: true })
    writeFileSync(
      OUTPUT,
      `// AUTO-GENERATED — 생성 실패. team.ts의 fallback이 사용됨.\nexport const HOLIDAYS_AUTO: readonly string[] = []\n`,
      'utf8',
    )
  }
}

function main() {
  try {
    const dates = buildAllDates()
    if (dates.length === 0) throw new Error('빈 결과 — date-holidays 동작 점검 필요')
    mkdirSync(dirname(OUTPUT), { recursive: true })
    writeFileSync(OUTPUT, generate(dates), 'utf8')
    const years = buildYears()
    console.log(`[holidays] ${dates.length}건 (${years[0]}~${years.at(-1)}) → ${OUTPUT}`)
  } catch (err) {
    console.warn(`[holidays] 생성 실패: ${err.message}`)
    console.warn('[holidays] team.ts의 HOLIDAYS_FALLBACK이 사용됩니다.')
    writeEmptyIfMissing()
  }
}

main()
