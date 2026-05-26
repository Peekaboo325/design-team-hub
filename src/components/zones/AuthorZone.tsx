import type { FormState } from '../../types'
import { ADVERTISERS, TEAMS, REQUESTERS } from '../../data/team'
import { Chip } from '../ui/Chip'
import { ChipInput } from '../ui/ChipInput'
import { TextInput } from '../ui/TextInput'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

// 광고주 정렬 — 한글 가나다순 우선, 영문은 뒤로.
function compareKoreanFirst(a: string, b: string): number {
  const isKoreanA = /^[가-힣]/.test(a)
  const isKoreanB = /^[가-힣]/.test(b)
  if (isKoreanA && !isKoreanB) return -1
  if (!isKoreanA && isKoreanB) return 1
  return a.localeCompare(b, 'ko')
}

export function AuthorZone({ value, onChange }: Props) {
  const requesterCandidates =
    !value.teamIsCustom && (TEAMS as readonly string[]).includes(value.team)
      ? REQUESTERS[value.team as (typeof TEAMS)[number]]
      : []

  const sortedAdvertisers = [...ADVERTISERS].sort(compareKoreanFirst)

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>기본 정보</h2>
      </header>

      <div className={styles.body}>
        {/* 메일 — 제목 + 비고 한 줄 */}
        <div className={styles.mailRow}>
          <TextInput
            label="메일 제목"
            value={value.mailTitle}
            onChange={(e) => onChange({ mailTitle: e.target.value })}
          />
          <TextInput
            label="메일 비고"
            value={value.mailNote}
            onChange={(e) => onChange({ mailNote: e.target.value })}
          />
        </div>

        {/* 팀 — 1팀/2팀 칩 + 직접 입력 (인라인) */}
        <div>
          <span className={styles.fieldLabel}>팀</span>
          <div className={styles.chips}>
            {TEAMS.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={!value.teamIsCustom && value.team === t}
                onClick={() =>
                  onChange({ team: t, teamIsCustom: false, requester: '', requesterIsCustom: false })
                }
              />
            ))}
            {value.teamIsCustom ? (
              <ChipInput
                value={value.team}
                onChange={(e) => onChange({ team: e.target.value })}
              />
            ) : (
              <Chip
                label="직접 입력"
                variant="ghost"
                onClick={() =>
                  onChange({ team: '', teamIsCustom: true, requester: '', requesterIsCustom: true })
                }
              />
            )}
          </div>
        </div>

        {/* 요청자 — 팀 따라 후보 또는 직접 입력 (인라인).
            팀 미선택이면 '팀을 먼저 선택해주세요' 비활성 칩으로 영역 유지 (덜컹거림 방지). */}
        <div>
          <span className={styles.fieldLabel}>요청자(기획자)</span>
          {value.teamIsCustom ? (
            <div className={styles.chips}>
              <ChipInput
                value={value.requester}
                onChange={(e) => onChange({ requester: e.target.value })}
              />
            </div>
          ) : requesterCandidates.length > 0 ? (
            <div className={styles.chips}>
              {requesterCandidates.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  selected={!value.requesterIsCustom && value.requester === name}
                  onClick={() => onChange({ requester: name, requesterIsCustom: false })}
                />
              ))}
              {value.requesterIsCustom ? (
                <ChipInput
                  value={value.requester}
                  onChange={(e) => onChange({ requester: e.target.value })}
                />
              ) : (
                <Chip
                  label="직접 입력"
                  variant="ghost"
                  onClick={() => onChange({ requester: '', requesterIsCustom: true })}
                />
              )}
            </div>
          ) : (
            <div className={styles.chips}>
              <Chip label="팀을 먼저 선택해주세요" variant="ghost" disabled />
            </div>
          )}
        </div>

        {/* 광고주 — 칩 + 직접 입력 (인라인) */}
        <div>
          <span className={styles.fieldLabel}>광고주</span>
          <div className={styles.chips}>
            {sortedAdvertisers.map((name) => (
              <Chip
                key={name}
                label={name}
                selected={!value.advertiserIsCustom && value.advertiser === name}
                onClick={() => onChange({ advertiser: name, advertiserIsCustom: false })}
              />
            ))}
            {value.advertiserIsCustom ? (
              <ChipInput
                value={value.advertiser}
                onChange={(e) => onChange({ advertiser: e.target.value })}
              />
            ) : (
              <Chip
                label="직접 입력"
                variant="ghost"
                onClick={() => onChange({ advertiser: '', advertiserIsCustom: true })}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
