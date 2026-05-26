import { useState } from 'react'
import type { FormState, WorkRow } from '../../types'
import { WORK_TYPES, ONLINE_DEFAULT_CATEGORIES, type Channel } from '../../data/team'
import { Chip } from '../ui/Chip'
import { TextInput } from '../ui/TextInput'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

export function WorkZone({ value, onChange }: Props) {
  const work = value.work

  // 온라인 종류 더보기 토글 (오프라인은 항상 전체 표시)
  const [showAllOnline, setShowAllOnline] = useState(false)

  const updateWork = (patch: Partial<WorkRow>) => {
    onChange({ work: { ...work, ...patch } })
  }

  // 오프라인 ↔ 온라인 전환 링크 — 1-2회/년 동선이라 칩이 아닌 텍스트 링크로
  const toggleChannel = () => {
    const next: Channel = work.channel === 'offline' ? 'online' : 'offline'
    updateWork({ channel: next, category: '', detail: '' })
    setShowAllOnline(false)
  }

  // 종류 후보 — 채널 / 더보기 / 선택값에 따라 달라짐
  const allCategories = work.channel ? Object.keys(WORK_TYPES[work.channel]) : []
  const defaultOnline = [...ONLINE_DEFAULT_CATEGORIES] as string[]
  const restOnline = allCategories.filter((c) => !defaultOnline.includes(c))

  let visibleCategories: string[]
  if (work.channel === 'offline') {
    visibleCategories = allCategories
  } else if (showAllOnline) {
    visibleCategories = [...defaultOnline, ...restOnline]
  } else {
    visibleCategories =
      work.category && !defaultOnline.includes(work.category)
        ? [...defaultOnline, work.category]
        : defaultOnline
  }

  const showMoreToggle = work.channel === 'online' && restOnline.length > 0

  const details =
    work.channel && work.category
      ? (WORK_TYPES[work.channel] as Record<string, readonly string[]>)[work.category] ?? []
      : []

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>작업 정보</h2>
        <p className={styles.subtitle}>
          종류 → 상세 순으로 선택. 기본 온라인. 소재가 여러 개면 다음 단계에서 [+] 복제 예정.
        </p>
      </header>

      <div className={styles.body}>
        {/* 종류 — 라벨 우측에 오프라인 전환 링크 (1-2회/년 동선이라 작게) */}
        <div>
          <div className={styles.categoryHeader}>
            <span className={styles.fieldLabel}>종류</span>
            <button
              type="button"
              className={styles.channelSwitch}
              onClick={toggleChannel}
            >
              {work.channel === 'online' ? '오프라인 종류 →' : '← 온라인 종류'}
            </button>
          </div>
          <div className={styles.chips}>
            {visibleCategories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={work.category === cat}
                onClick={() => updateWork({ category: cat, detail: '' })}
              />
            ))}
            {showMoreToggle &&
              (showAllOnline ? (
                <Chip
                  label="접기"
                  variant="ghost"
                  onClick={() => setShowAllOnline(false)}
                />
              ) : (
                <Chip
                  label={`더보기 (${restOnline.length})`}
                  variant="ghost"
                  onClick={() => setShowAllOnline(true)}
                />
              ))}
          </div>
        </div>

        {/* 상세 (종류 선택 후, 상세가 있는 종류만 노출) */}
        {work.channel && work.category && details.length > 0 && (
          <div>
            <span className={styles.fieldLabel}>상세</span>
            <div className={styles.chips}>
              {details.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  selected={work.detail === d}
                  onClick={() => updateWork({ detail: d })}
                />
              ))}
            </div>
          </div>
        )}

        {/* 수량 + 비고 — 한 줄. 수량 좁게, 비고 와이드. */}
        <div className={styles.qtyNoteRow}>
          <TextInput
            type="number"
            label="수량"
            inputMode="numeric"
            min={1}
            value={work.quantity}
            onChange={(e) => updateWork({ quantity: e.target.value })}
          />
          <TextInput
            label="비고"
            placeholder="이 소재만의 특이사항 (선택)"
            value={work.note}
            onChange={(e) => updateWork({ note: e.target.value })}
          />
        </div>
      </div>
    </section>
  )
}
