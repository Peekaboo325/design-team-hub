import { useEffect, useRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './ChipInput.module.css'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  // 마운트 시 자동 포커스 (기본 true) — 직접 입력 칩에서 인라인 입력으로 전환될 때 바로 타이핑 가능
  autoFocusOnMount?: boolean
}

// 칩과 동일한 사이즈/모양의 인라인 입력 박스.
// '직접 입력' 칩을 누르면 이 컴포넌트로 갈아끼워서 그 자리에서 바로 타이핑.
export function ChipInput({ autoFocusOnMount = true, className, ...rest }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocusOnMount && ref.current) {
      ref.current.focus()
      ref.current.select()
    }
  }, [autoFocusOnMount])

  return (
    <input
      ref={ref}
      className={[styles.chipInput, className ?? ''].join(' ')}
      {...rest}
    />
  )
}
