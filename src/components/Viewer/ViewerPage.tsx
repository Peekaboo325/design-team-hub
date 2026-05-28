import { useEffect, useState } from 'react'
import { listSchedules, type ScheduleRow } from '../../api'
import { RowItem } from './RowItem'
import styles from './ViewerPage.module.css'

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; rows: ScheduleRow[]; fetchedAt: string; sheetName: string }
  | { kind: 'error'; message: string }

// 'YYYY-MM-DDTHH:mm:ss.sss+09:00' → 'HH:mm:ss' (한국 시간 그대로)
function shortTime(iso: string): string {
  const m = iso.match(/T(\d{2}:\d{2}:\d{2})/)
  return m ? m[1] : iso
}

export function ViewerPage() {
  const [state, setState] = useState<LoadState>({ kind: 'idle' })

  const load = async () => {
    setState({ kind: 'loading' })
    try {
      const res = await listSchedules()
      if ('ok' in res && res.ok) {
        setState({ kind: 'ok', rows: res.rows, fetchedAt: res.fetchedAt, sheetName: res.sheetName })
      } else {
        const msg = 'error' in res ? res.error : '알 수 없는 응답'
        setState({ kind: 'error', message: msg })
      }
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerMain}>
          <h1 className={styles.pageTitle}>팀 스케줄</h1>
          <p className={styles.pageDesc}>
            {state.kind === 'ok'
              ? `${state.sheetName} · ${state.rows.length}건 · ${shortTime(state.fetchedAt)} 기준`
              : '신규·유지보수 시트 전체'}
          </p>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={load}
          disabled={state.kind === 'loading'}
        >
          {state.kind === 'loading' ? '불러오는 중...' : '새로고침'}
        </button>
      </header>

      <div className={styles.body}>
        {state.kind === 'loading' && (
          <div className={styles.placeholder}>시트에서 불러오는 중...</div>
        )}

        {state.kind === 'error' && (
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>불러오기 실패</div>
            <div className={styles.errorMessage}>{state.message}</div>
            <button className={styles.retryBtn} onClick={load}>다시 시도</button>
          </div>
        )}

        {state.kind === 'ok' && state.rows.length === 0 && (
          <div className={styles.placeholder}>등록된 작업이 없습니다.</div>
        )}

        {state.kind === 'ok' && state.rows.length > 0 && (
          <div className={styles.list}>
            {state.rows.map((row) => (
              <RowItem key={row.id || `row-${row.row}`} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
