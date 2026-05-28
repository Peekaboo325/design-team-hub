import type { ScheduleRow } from '../../api'
import styles from './RowItem.module.css'

type Props = {
  row: ScheduleRow
}

// 상태별 표시 (위젯 체계: 예/대/진/완)
const STATUS_LABEL: Record<string, { short: string; cls: string }> = {
  예정: { short: '예정', cls: styles.statusYejeong },
  대기: { short: '대기', cls: styles.statusDaegi },
  진행: { short: '진행', cls: styles.statusJinhaeng },
  완료: { short: '완료', cls: styles.statusWanlyo },
}

// 'YYYY-MM-DD' → 'MM.DD' (짧게 표기)
function shortDate(ymd: string): string {
  if (!ymd) return ''
  const m = ymd.match(/^\d{4}-(\d{2})-(\d{2})$/)
  return m ? `${m[1]}.${m[2]}` : ymd
}

export function RowItem({ row }: Props) {
  const statusStyle = STATUS_LABEL[row.status] ?? { short: row.status || '—', cls: styles.statusUnknown }

  const received = shortDate(row.receivedDate)
  const deadline = shortDate(row.deadline)
  const dateRange = received && deadline
    ? `${received} → ${deadline}`
    : received
      ? `${received} (당일)`
      : deadline
        ? `~ ${deadline}`
        : ''

  return (
    <article className={styles.row}>
      <div className={styles.statusCol}>
        <span className={`${styles.statusBadge} ${statusStyle.cls}`}>{statusStyle.short}</span>
      </div>

      <div className={styles.mainCol}>
        <div className={styles.titleLine}>
          <span className={styles.advertiser}>{row.advertiser || '—'}</span>
          <span className={styles.category}>{row.category || '—'}</span>
          {typeof row.quantity === 'number' && row.quantity > 1 && (
            <span className={styles.quantity}>×{row.quantity}</span>
          )}
        </div>

        <div className={styles.metaLine}>
          {row.designer && <span className={styles.designer}>{row.designer}</span>}
          {row.requester && <span className={styles.requester}>{row.requester}</span>}
          {row.team && <span className={styles.team}>{row.team}</span>}
          {row.type && row.type !== '일반' && (
            <span className={`${styles.typeBadge} ${row.type === '급건' ? styles.typeUrgent : ''}`}>
              {row.type}
            </span>
          )}
        </div>

        {dateRange && <div className={styles.dateLine}>{dateRange}</div>}

        {row.mailTitle && (
          <div className={styles.mailLine} title={row.mailTitle}>
            <span className={styles.mailIcon}>✉</span>
            <span className={styles.mailText}>{row.mailTitle}</span>
          </div>
        )}

        {row.note && (
          <div className={styles.noteLine} title={row.note}>
            <span className={styles.noteIcon}>·</span>
            <span className={styles.noteText}>{row.note}</span>
          </div>
        )}
      </div>
    </article>
  )
}
