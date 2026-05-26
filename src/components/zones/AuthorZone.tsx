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
// (소스 파일도 이미 정렬되어 있지만, 새 항목을 아무 위치에 넣어도 안전하도록 렌더 시점에도 정렬)
function compareKoreanFirst(a: string, b: string): number {
  const isKoreanA = /^[가-힣]/.test(a)
  const isKoreanB = /^[가-힣]/.test(b)
  if (isKoreanA && !isKoreanB) return -1
  if (!isKoreanA && isKoreanB) return 1
  return a.localeCompare(b, 'ko')
}

export function AuthorZone({ value, onChange }: Props) {
  // 팀이 내부 팀이면 그 팀 요청자 후보 노출. 외부(직접 입력) 모드면 후보 없음.
  const requesterCandidates =
    !value.teamIsCustom && (TEAMS as readonly string[]).includes(value.team)
      ? REQUESTERS[value.team as (typeof TEAMS)[number]]
      : []

  const sortedAdvertisers = [...ADVERTISERS].sort(compareKoreanFirst)

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>기본 정보</h2>
        <p className={styles.subtitle}>메일 · 광고주 · 팀 · 요청자(AE). 외부 팀은 직접 입력.</p>
      </header>

      <div className={styles.body}>
        {/* 메일 — 제목 + 비고 한 줄 */}
        <div className={styles.mailRow}>
          <TextInput
            label="메일 제목"
            placeholder="예: [관절보궁] 5월 4주차 KV 시안 의뢰"
            value={value.mailTitle}
            onChange={(e) => onChange({ mailTitle: e.target.value })}
          />
          <TextInput
            label="메일 비고"
            placeholder="동일 제목 메일을 구분할 메모 (선택)"
            value={value.mailNote}
            onChange={(e) => onChange({ mailNote: e.target.value })}
          />
        </div>

        {/* 광고주 — 칩 한 화면 (가나다순 + 영문 뒤) */}
        <div>
          <span className={styles.fieldLabel}>광고주</span>
          <div className={styles.chips}>
            {sortedAdvertisers.map((name) => (
              <Chip
                key={name}
                label={name}
                selected={value.advertiser === name}
                onClick={() => onChange({ advertiser: name })}
              />
            ))}
          </div>
        </div>

        {/* 팀 — 1팀/2팀 칩 + 직접 입력 (칩 자리에서 인라인 입력) */}
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
                placeholder="팀 이름"
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

        {/* 요청자 — 팀 따라 후보 또는 직접 입력 (인라인) */}
        <div>
          <span className={styles.fieldLabel}>요청자(AE)</span>
          {value.teamIsCustom ? (
            // 외부 팀이면 요청자도 자동으로 직접 입력 모드 (후보 없음)
            <div className={styles.chips}>
              <ChipInput
                placeholder="요청자 이름"
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
                  placeholder="요청자 이름"
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
            <p className={styles.subtitle}>팀을 먼저 선택해주세요.</p>
          )}
        </div>
      </div>
    </section>
  )
}
