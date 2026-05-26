import type { FormState, Group } from '../../types'
import { EMPTY_GROUP, EMPTY_MATERIAL } from '../../types'
import { WorkGroup } from './WorkGroup'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

export function WorkZone({ value, onChange }: Props) {
  const { groups } = value
  const isMulti = groups.length > 1

  const updateGroup = (idx: number, patch: Partial<Group>) => {
    const next = groups.map((g, i) => (i === idx ? { ...g, ...patch } : g))
    onChange({ groups: next })
  }

  const addGroup = () => {
    // 새 그룹은 빈 상태(기본 온라인). 직전 그룹 복제 안 함 — 다른 종류 추가가 목적이므로.
    onChange({
      groups: [...groups, { ...EMPTY_GROUP, materials: [{ ...EMPTY_MATERIAL }] }],
    })
  }

  const removeGroup = (idx: number) => {
    if (groups.length <= 1) return
    onChange({ groups: groups.filter((_, i) => i !== idx) })
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>작업 정보</h2>
        <p className={styles.subtitle}>
          종류 → 상세 → 소재(수량·비고) 순. 한 메일에 여러 종류가 섞이면 아래 [+ 다른 종류 추가].
        </p>
      </header>

      <div className={styles.body}>
        {groups.map((group, idx) => (
          <WorkGroup
            key={idx}
            value={group}
            index={idx}
            showGroupHeader={isMulti}
            onChange={(patch) => updateGroup(idx, patch)}
            onRemove={() => removeGroup(idx)}
          />
        ))}

        <button type="button" className={styles.addGroupBtn} onClick={addGroup}>
          + 다른 종류 추가
        </button>
      </div>
    </section>
  )
}
