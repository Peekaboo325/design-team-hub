import type { FormState } from '../../types'
import { ADVERTISERS, TEAMS, REQUESTERS } from '../../data/team'
import { Chip } from '../ui/Chip'
import { TextInput } from '../ui/TextInput'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
}

export function AuthorZone({ value, onChange }: Props) {
  // 팀이 내부 팀이면 그 팀 요청자 후보 노출. 외부(직접 입력) 모드면 후보 없음.
  const requesterCandidates =
    !value.teamIsCustom && (TEAMS as readonly string[]).includes(value.team)
      ? REQUESTERS[value.team as (typeof TEAMS)[number]]
      : []

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>작성자</h2>
        <p className={styles.subtitle}>광고주, 팀, 요청자(AE). 외부 팀은 직접 입력.</p>
      </header>

      <div className={styles.body}>
        {/* 광고주 — 칩 한 화면 */}
        <div>
          <span className={styles.fieldLabel}>광고주</span>
          <div className={styles.chips}>
            {ADVERTISERS.map((name) => (
              <Chip
                key={name}
                label={name}
                selected={value.advertiser === name}
                onClick={() => onChange({ advertiser: name })}
              />
            ))}
          </div>
        </div>

        {/* 팀 — 1팀/2팀 칩 + 직접 입력 */}
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
            <Chip
              label={value.teamIsCustom ? '직접 입력 중' : '직접 입력'}
              variant="ghost"
              selected={value.teamIsCustom}
              onClick={() =>
                onChange({ team: '', teamIsCustom: true, requester: '', requesterIsCustom: true })
              }
            />
          </div>
          {value.teamIsCustom && (
            <div style={{ marginTop: 12 }}>
              <TextInput
                placeholder="예: 4본부 마케팅팀"
                value={value.team}
                onChange={(e) => onChange({ team: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* 요청자 — 팀 따라 후보 또는 직접 입력 */}
        <div>
          <span className={styles.fieldLabel}>요청자(AE)</span>
          {value.teamIsCustom ? (
            <TextInput
              placeholder="외부 팀 요청자 이름"
              value={value.requester}
              onChange={(e) => onChange({ requester: e.target.value })}
            />
          ) : requesterCandidates.length > 0 ? (
            <>
              <div className={styles.chips}>
                {requesterCandidates.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    selected={!value.requesterIsCustom && value.requester === name}
                    onClick={() => onChange({ requester: name, requesterIsCustom: false })}
                  />
                ))}
                <Chip
                  label={value.requesterIsCustom ? '직접 입력 중' : '직접 입력'}
                  variant="ghost"
                  selected={value.requesterIsCustom}
                  onClick={() => onChange({ requester: '', requesterIsCustom: true })}
                />
              </div>
              {value.requesterIsCustom && (
                <div style={{ marginTop: 12 }}>
                  <TextInput
                    placeholder="요청자 이름"
                    value={value.requester}
                    onChange={(e) => onChange({ requester: e.target.value })}
                  />
                </div>
              )}
            </>
          ) : (
            <p className={styles.subtitle}>팀을 먼저 선택해주세요.</p>
          )}
        </div>
      </div>
    </section>
  )
}
