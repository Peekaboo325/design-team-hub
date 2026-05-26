import { useState } from 'react'
import type { FormState } from '../../types'
import {
  ADVERTISERS,
  ADVERTISERS_BY_TEAM,
  TEAMS,
  REQUESTERS,
  REQUESTER_DEFAULT_ADVERTISERS,
} from '../../data/team'
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
  // 팀별 후보
  const isInternalTeam = !value.teamIsCustom && (TEAMS as readonly string[]).includes(value.team)
  const team = value.team as (typeof TEAMS)[number]

  const requesterCandidates = isInternalTeam ? REQUESTERS[team] : []
  const teamAdvertisers = isInternalTeam ? ADVERTISERS_BY_TEAM[team] : []

  const sortedAllAdvertisers = [...ADVERTISERS].sort(compareKoreanFirst)
  const sortedTeamAdvertisers = [...teamAdvertisers].sort(compareKoreanFirst)
  const restAdvertisers = sortedAllAdvertisers.filter((a) => !teamAdvertisers.includes(a))

  // 광고주 더보기 토글 — 팀이 정해진 경우만 의미 있음
  const [showAllAdvertisers, setShowAllAdvertisers] = useState(false)

  // 화면에 보일 광고주 칩 결정 — 케이스별
  let visibleAdvertisers: string[] = []
  if (value.teamIsCustom) {
    // 외부 팀: 모든 광고주 (가나다순) — 더보기 없음
    visibleAdvertisers = sortedAllAdvertisers
  } else if (isInternalTeam) {
    if (showAllAdvertisers) {
      // 펼침: 자기 팀 + 나머지
      visibleAdvertisers = [...sortedTeamAdvertisers, ...restAdvertisers]
    } else {
      // 접힘: 자기 팀만. 단 현재 선택이 자기 팀 외면 그것도 함께 표시 (선택값 사라지지 않게)
      visibleAdvertisers =
        value.advertiser && !value.advertiserIsCustom && !teamAdvertisers.includes(value.advertiser)
          ? [...sortedTeamAdvertisers, value.advertiser]
          : sortedTeamAdvertisers
    }
  }
  const showAdvertiserMore = isInternalTeam && restAdvertisers.length > 0

  // 요청자별 담당 광고주 — 선택된 요청자가 있고 매핑이 비어있지 않을 때만 강조 효과 발동.
  // 매핑된 광고주는 진하게(normal), 그 외 광고주는 흐리게(muted).
  const requesterDefaults: readonly string[] =
    !value.requesterIsCustom && value.requester
      ? REQUESTER_DEFAULT_ADVERTISERS[value.requester] ?? []
      : []
  const hasEmphasis = requesterDefaults.length > 0

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
                onClick={() => {
                  // 이미 선택된 팀을 다시 누르면 선택 해제. 요청자도 함께 클리어.
                  const isCurrent = !value.teamIsCustom && value.team === t
                  onChange({
                    team: isCurrent ? '' : t,
                    teamIsCustom: false,
                    requester: '',
                    requesterIsCustom: false,
                  })
                  setShowAllAdvertisers(false)
                }}
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
                onClick={() => {
                  onChange({ team: '', teamIsCustom: true, requester: '', requesterIsCustom: true })
                  setShowAllAdvertisers(false)
                }}
              />
            )}
          </div>
        </div>

        {/* 요청자 — 팀 따라 후보 또는 직접 입력 (인라인).
            팀 미선택이면 '팀을 먼저 선택해주세요' 비활성 칩으로 영역 유지. */}
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
                  onClick={() => {
                    const isCurrent = !value.requesterIsCustom && value.requester === name
                    onChange({
                      requester: isCurrent ? '' : name,
                      requesterIsCustom: false,
                    })
                  }}
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

        {/* 광고주 — 팀별 후보 + 더보기 + 직접 입력. 팀 미선택이면 비활성 칩. */}
        <div>
          <span className={styles.fieldLabel}>광고주</span>
          {!value.teamIsCustom && !isInternalTeam ? (
            <div className={styles.chips}>
              <Chip label="팀을 먼저 선택해주세요" variant="ghost" disabled />
            </div>
          ) : (
            <div className={styles.chips}>
              {visibleAdvertisers.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  selected={!value.advertiserIsCustom && value.advertiser === name}
                  muted={hasEmphasis && !requesterDefaults.includes(name)}
                  onClick={() => {
                    const isCurrent = !value.advertiserIsCustom && value.advertiser === name
                    onChange({
                      advertiser: isCurrent ? '' : name,
                      advertiserIsCustom: false,
                    })
                  }}
                />
              ))}
              {showAdvertiserMore &&
                (showAllAdvertisers ? (
                  <Chip
                    label="접기"
                    variant="ghost"
                    onClick={() => setShowAllAdvertisers(false)}
                  />
                ) : (
                  <Chip
                    label={`더보기 (${restAdvertisers.length})`}
                    variant="ghost"
                    onClick={() => setShowAllAdvertisers(true)}
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
          )}
        </div>
      </div>
    </section>
  )
}
