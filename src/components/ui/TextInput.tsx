import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import styles from './TextInput.module.css'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  helper?: string
}

export function TextInput({ label, helper, className, ...rest }: InputProps) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <input className={[styles.input, className ?? ''].join(' ')} {...rest} />
      {helper && <span className={styles.helper}>{helper}</span>}
    </label>
  )
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  helper?: string
}

export function TextArea({ label, helper, className, ...rest }: TextareaProps) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <textarea className={[styles.input, styles.textarea, className ?? ''].join(' ')} {...rest} />
      {helper && <span className={styles.helper}>{helper}</span>}
    </label>
  )
}
