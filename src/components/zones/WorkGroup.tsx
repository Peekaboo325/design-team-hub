import { useState } from 'react'
import type { Group, Material } from '../../types'
import { incrementTrailingNumber } from '../../types'
import { WORK_TYPES, ONLINE_DEFAULT_CATEGORIES, DESIGNERS, type Channel } from '../../data/team'
import { Chip } from '../ui/Chip'
import { TextInput } from '../ui/TextInput'
import { Dropdown } from '../ui/Dropdown'
import styles from './Zone.module.css'

type Props = {
  value: Group
  index: number                    // 0부터. 표시용 ('종류 #N')
  showGroupHeader: boolean         // groups.length > 1일 때만 그룹 헤더(번호 + 제거 버튼) 노출
  onChange: (patch: Partial<Group>) => void
  onRemove: () => void             // 호출자가 groups.length > 1일 때만 사용
}

export function WorkGroup({ value, index, showGroupHeader, onChange, onRemove }: Props) {
  // 더보기 상태는 그룹별로 독립 — 한 그룹은 펼치고 다른 그룹은 접힘 가능
  const [showAllOnline, setShowAllOnline] = useState(false)

  const toggleChannel = () => {
    const next: Channel = value.channel === 'offline' ? 'online' : 'offline'
    onChange({ channel: next, category: '', detail: '' })
    setShowAllOnline(false)
  }

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

  const updateMaterial = (idx: number, patch: Partial<Material>) => {
    const next = value.materials.map((m, i) => (i === idx ? { ...m, ...patch } : m))
    onChange({ materials: next })
  }

  const cloneMaterial = (idx: number) => {
    // 복제 시 작업 내용 끝의 숫자가 있으면 +1 자동 증가 (예: 메타01 → 메타02)
    const src = value.materials[idx]
    const cloned: Material = { ...src, note: incrementTrailingNumber(src.note) }
    const next = [...value.materials]
    next.splice(idx + 1, 0, cloned)
    onChange({ materials: next })
  }

  const removeMaterial = (idx: number) => {
    if (value.materials.length <= 1) return
    onChange({ materials: value.materials.filter((_, i) => i !== idx) })
  }

  const wrapperCls = [
    styles.groupWrapper,
    showGroupHeader ? styles.groupBox : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={wrapperCls}>
      {showGroupHeader && (
        <div className={styles.groupHeader}>
          <span className={styles.groupTitle}>종류 #{index + 1}</span>
          <button
            type="button"
            className={styles.groupRemove}
            onClick={onRemove}
            aria-label="이 종류 그룹 제거"
          >
            × 제거
          </button>
        </div>
      )}

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

      {/* 소재 N개 — 한 줄: 수량 / 작업 내용 / 디자이너 / 액션 */}
      <div className={styles.materialsBlock}>
        <div className={styles.materialsHeader}>
          <span className={styles.fieldLabel} style={{ marginBottom: 0 }}>수량</span>
          <span className={styles.fieldLabel} style={{ marginBottom: 0 }}>작업 내용</span>
          <span className={styles.fieldLabel} style={{ marginBottom: 0 }}>디자이너</span>
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
            <Dropdown
              value={mat.designer}
              options={DESIGNERS}
              onChange={(v) => updateMaterial(idx, { designer: v })}
              emptyLabel="미배정"
              ariaLabel="담당 디자이너"
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
  )
}
