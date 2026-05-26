import { GAS_URL } from './config'
import type { FormState } from './types'

// hub-api.gs의 createSchedule 응답 형식
export type CreateScheduleResult =
  | { ok: true; rowsCreated: number; ids: string[] }
  | { ok?: false; error: string; code?: string; stack?: string }

// GAS hub-api.gs의 action='create' endpoint 호출.
//
// CORS 회피:
//   Content-Type 헤더를 박지 않음 → simple request로 분류돼 preflight(OPTIONS) 없음.
//   GAS는 e.postData.contents로 raw body string을 받아 JSON.parse 함.
//
// 네트워크 에러는 throw, GAS 응답 에러는 { error } 형태로 반환.
export async function createSchedule(form: FormState): Promise<CreateScheduleResult> {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'create', form }),
    // Content-Type 미지정 (CORS preflight 회피)
    redirect: 'follow',  // GAS는 script.googleusercontent.com으로 302 redirect
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }
  return res.json()
}
