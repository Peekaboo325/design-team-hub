import { SHEETS, type SheetName } from '../config'
import { getCurrentSheet, setCurrentSheet } from '../currentSheet'
import styles from './SheetPicker.module.css'

// 테스트 기간 임시 UI — 운영 전환 시 이 컴포넌트만 App.tsx import에서 제거하면 사라짐.
// localStorage 갱신 후 location.reload()로 간단히 상태 전파.
const OPTIONS: { value: SheetName; label: string; icon: string }[] = [
  { value: SHEETS.TEST, label: 'TEST', icon: '🧪' },
  { value: SHEETS.PRODUCTION, label: '실 시트', icon: '🚀' },
]

export function SheetPicker() {
  const current = getCurrentSheet()

  const handleChange = (next: SheetName) => {
    if (next === current) return
    setCurrentSheet(next)
    window.location.reload()
  }

  return (
    <div className={styles.picker} role="group" aria-label="시트 선택 (테스트용)">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.option} ${opt.value === current ? styles.active : ''}`}
          onClick={() => handleChange(opt.value)}
          title={opt.value}
        >
          <span className={styles.icon}>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
