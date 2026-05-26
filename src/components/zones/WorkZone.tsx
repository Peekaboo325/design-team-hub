import { useState } from 'react'
import type { FormState, WorkRow } from '../../types'
import { WORK_TYPES, ONLINE_DEFAULT_CATEGORIES, type Channel } from '../../data/team'
import { Chip } from '../ui/Chip'
import { TextInput, TextArea } from '../ui/TextInput'
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

  // 온/오프 토글 — 칩 한 번 누르면 반대편으로 전환. 종류·상세는 채널 바뀌면 리셋.
  const toggleChannel = () => {
    const next: Channel = work.channel === 'offline' ? 'online' : 'offline'
    updateWork({ channel: next, category: '', detail: '' })
  }

  const channelLabel = work.channel === 'offline' ? '오프라인' : '온라인'

  // 종류 후보 계산 — 채널 / 더보기 상태 / 현재 선택에 따라 다름
  const allCategories = work.channel ? Object.keys(WORK_TYPES[work.channel]) : []
  const defaultOnline = [...ONLINE_DEFAULT_CATEGORIES] as string[]
  const restOnline = allCategories.filter((c) => !defaultOnline.includes(c))

  let visibleCategories: string[]
  if (work.channel === 'offline') {
    visibleCategories = allCategories
  } else if (showAllOnline) {
    visibleCategories = [...defaultOnline, ...restOnline]
  } else {
    // 접힘 상태: 기본 6개만. 단 현재 선택이 기본 밖이면 그것도 함께 보이게
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
          온/오프 → 종류 → 상세 순으로 선택. 소재가 여러 개면 다음 단계에서 [+] 복제 예정.
        </p>
      </header>

      <div className={styles.body}>
        {/* 온/오프 — 단일 토글 칩. 클릭하면 반대편으로 전환. */}
        <div>
          <span className={styles.fieldLabel}>온/오프</span>
          <div className={styles.chips}>
            <Chip label={`${channelLabel} ↔`} selected onClick={toggleChannel} />
          </div>
        </div>

        {/* 종류 — 온라인은 기본 6개 + 더보기, 오프라인은 전체 */}
        <div>
          <span className={styles.fieldLabel}>종류</span>
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

        {/* 수량 */}
        <TextInput
          type="number"
          label="수량"
          placeholder="숫자만"
          inputMode="numeric"
          min={1}
          value={work.quantity}
          onChange={(e) => updateWork({ quantity: e.target.value })}
        />

        {/* 비고 (소재별) */}
        <TextArea
          label="비고"
          placeholder="이 소재만의 특이사항 (선택)"
          value={work.note}
          onChange={(e) => updateWork({ note: e.target.value })}
        />
      </div>
    </section>
  )
}
