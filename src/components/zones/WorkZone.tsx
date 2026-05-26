import { useState } from 'react'
import type { FormState, Material } from '../../types'
import { EMPTY_MATERIAL } from '../../types'
import { WORK_TYPES, ONLINE_DEFAULT_CATEGORIES, type Channel } from '../../data/team'
import { Chip } from '../ui/Chip'
import { TextInput } from '../ui/TextInput'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

export function WorkZone({ value, onChange }: Props) {
  const [showAllOnline, setShowAllOnline] = useState(false)

  // 오프라인 ↔ 온라인 전환 — 종류·상세는 채널 바뀌면 리셋
  const toggleChannel = () => {
    const next: Channel = value.channel === 'offline' ? 'online' : 'offline'
    onChange({ channel: next, category: '', detail: '' })
    setShowAllOnline(false)
  }

  // 종류 후보 — 채널 / 더보기 / 선택값에 따라
  const allCategories = value.channel ? Object.keys(WORK_TYPES[value.channel]) : []
  const defaultOnline = [...ONLINE_DEFAULT_CATEGORIES] as string[]
  const restOnline = allCategories.filter((c) => !defaultOnline.includes(c))

  let visibleCategories: string[]
  if (value.channel === 'offline') {
    visibleCategories = allCategories
  } else if (showAllOnline) {
    visibleCategories = [...defaultOnline, ...restOnline]
  } else {
    visibleCategories =
      value.category && !defaultOnline.includes(value.category)
        ? [...defaultOnline, value.category]
        : defaultOnline
  }

  const showMoreToggle = value.channel === 'online' && restOnline.length > 0

  const details =
    value.channel && value.category
      ? (WORK_TYPES[value.channel] as Record<string, readonly string[]>)[value.category] ?? []
      : []

  // 소재 조작 — 복제 추가 / 한 줄 제거 / 부분 수정
  const updateMaterial = (idx: number, patch: Partial<Material>) => {
    const next = value.materials.map((m, i) => (i === idx ? { ...m, ...patch } : m))
    onChange({ materials: next })
  }

  const cloneMaterial = (idx: number) => {
    // 클릭한 줄의 내용을 그대로 복제해서 바로 아래에 삽입
    const cloned = { ...value.materials[idx] }
    const next = [...value.materials]
    next.splice(idx + 1, 0, cloned)
    onChange({ materials: next })
  }

  const removeMaterial = (idx: number) => {
    if (value.materials.length <= 1) return
    onChange({ materials: value.materials.filter((_, i) => i !== idx) })
  }

  // 최초 마운트 시 소재가 비어 있다면 한 줄 보장 (안전망)
  if (value.materials.length === 0) {
    onChange({ materials: [{ ...EMPTY_MATERIAL }] })
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>작업 정보</h2>
        <p className={styles.subtitle}>
          종류 → 상세 순으로 선택. 기본 온라인. 소재가 여러 개면 [+]로 줄을 복제.
        </p>
      </header>

      <div className={styles.body}>
        {/* 종류 — 라벨 우측에 오프라인 전환 링크 */}
        <div>
          <div className={styles.categoryHeader}>
            <span className={styles.fieldLabel}>종류</span>
            <button type="button" className={styles.channelSwitch} onClick={toggleChannel}>
              {value.channel === 'online' ? '오프라인 종류 →' : '← 온라인 종류'}
            </button>
          </div>
          <div className={styles.chips}>
            {visibleCategories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={value.category === cat}
                onClick={() => onChange({ category: cat, detail: '' })}
              />
            ))}
            {showMoreToggle &&
              (showAllOnline ? (
                <Chip label="접기" variant="ghost" onClick={() => setShowAllOnline(false)} />
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
        {value.channel && value.category && details.length > 0 && (
          <div>
            <span className={styles.fieldLabel}>상세</span>
            <div className={styles.chips}>
              {details.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  selected={value.detail === d}
                  onClick={() => onChange({ detail: d })}
                />
              ))}
            </div>
          </div>
        )}

        {/* 소재 N개 — 수량/비고/+/× 한 줄. 첫 줄 위에 컬럼 라벨. */}
        <div className={styles.materialsBlock}>
          <div className={styles.materialsHeader}>
            <span className={styles.fieldLabel} style={{ marginBottom: 0 }}>수량</span>
            <span className={styles.fieldLabel} style={{ marginBottom: 0 }}>비고</span>
            <span />
          </div>
          {value.materials.map((mat, idx) => (
            <div className={styles.materialRow} key={idx}>
              <TextInput
                type="number"
                inputMode="numeric"
                min={1}
                value={mat.quantity}
                onChange={(e) => updateMaterial(idx, { quantity: e.target.value })}
              />
              <TextInput
                value={mat.note}
                onChange={(e) => updateMaterial(idx, { note: e.target.value })}
              />
              <div className={styles.materialActions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => cloneMaterial(idx)}
                  title="이 줄 복제"
                  aria-label="이 줄 복제"
                >
                  +
                </button>
                {value.materials.length > 1 && (
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.removeBtn}`}
                    onClick={() => removeMaterial(idx)}
                    title="이 줄 제거"
                    aria-label="이 줄 제거"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
