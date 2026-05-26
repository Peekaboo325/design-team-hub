import styles from './Chip.module.css'

type Props = {
  label: string
  selected?: boolean
  onClick?: () => void
  // 의미상 변형 — 직접입력 칩 등 보조 액션용
  variant?: 'default' | 'ghost'
}

export function Chip({ label, selected, onClick, variant = 'default' }: Props) {
  const cls = [
    styles.chip,
    selected ? styles.selected : '',
    variant === 'ghost' ? styles.ghost : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={cls} onClick={onClick} aria-pressed={selected}>
      {label}
    </button>
  )
}
