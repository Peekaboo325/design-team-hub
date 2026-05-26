import styles from './Chip.module.css'

type Props = {
  label: string
  selected?: boolean
  onClick?: () => void
  // 의미상 변형 — 직접입력 칩 등 보조 액션용
  variant?: 'default' | 'ghost'
  // 비활성 (placeholder 안내 칩 등) — 흐림 + 클릭 불가
  disabled?: boolean
  // 탈강조 — 클릭은 가능하지만 시각적으로 흐림 (요청자별 추천 외 광고주 등)
  muted?: boolean
  // 외부에서 추가 클래스 결합 (예: 균일 폭, 정렬 등)
  className?: string
}

export function Chip({
  label,
  selected,
  onClick,
  variant = 'default',
  disabled,
  muted,
  className,
}: Props) {
  const cls = [
    styles.chip,
    selected ? styles.selected : '',
    variant === 'ghost' ? styles.ghost : '',
    muted ? styles.muted : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}
