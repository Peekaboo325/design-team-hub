import { useEffect, useRef, useState } from 'react'
import type { FormState, Validation } from '../../types'
import {
  ADVERTISERS,
  ADVERTISERS_BY_TEAM,
  TEAMS,
  REQUESTERS,
  REQUESTER_DEFAULT_ADVERTISERS,
} from '../../data/team'
import { checkDuplicates, type DuplicateMatch } from '../../api'
import { Chip } from '../ui/Chip'
import { ChipInput } from '../ui/ChipInput'
import { TextInput } from '../ui/TextInput'
import styles from './Zone.module.css'

type Props = {
  value: FormState
  onChange: (patch: Partial<FormState>) => void
  validation: Validation
  duplicates: DuplicateMatch[]                       // 부모(EditorForm)가 보유
  onDuplicatesChange: (d: DuplicateMatch[]) => void  // onBlur 시 부모에 알림
}

// 광고주 정렬 — 한글 가나다순 우선, 영문은 뒤로.
function compareKoreanFirst(a: string, b: string): number {
  const isKoreanA = /^[가-힣]/.test(a)
  const isKoreanB = /^[가-힣]/.test(b)
  if (isKoreanA && !isKoreanB) return -1
  if (!isKoreanA && isKoreanB) return 1
  return a.localeCompare(b, 'ko')
}

export function AuthorZone({ value, onChange, validation, duplicates, onDuplicatesChange }: Props) {
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

  // 메일 제목 중복 감지 — onBlur 시 GAS에 조회. 매칭 발견 시 부모에 보고.
  // 같은 제목 반복 조회 방지를 위해 마지막 조회 제목 ref에 저장.
  const lastCheckedTitle = useRef<string>('')

  // 외부에서 mailTitle이 빈 값(초기화)으로 바뀌면 lastCheckedTitle도 리셋 —
  // 다음 같은 제목 입력 시 재조회되도록.
  useEffect(() => {
    if (value.mailTitle === '') {
      lastCheckedTitle.current = ''
    }
  }, [value.mailTitle])

  const handleMailTitleBlur = async () => {
    const title = value.mailTitle.trim()
    if (!title) {
      onDuplicatesChange([])
      lastCheckedTitle.current = ''
      return
    }
    if (title === lastCheckedTitle.current) return  // 변경 없음 — 재조회 skip
    lastCheckedTitle.current = title
    try {
      const result = await checkDuplicates(title)
      if ('matches' in result) onDuplicatesChange(result.matches)
      else onDuplicatesChange([])
    } catch {
      onDuplicatesChange([])  // 네트워크 실패 시 조용히 (사용자 차단 X)
    }
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>기본 정보</h2>
      </header>

      <div className={styles.body}>
        {/* 메일 — 제목 + 비고 한 줄 */}
        <div>
          <div className={styles.mailRow}>
            <TextInput
              label="메일 제목"
              value={value.mailTitle}
              onChange={(e) => onChange({ mailTitle: e.target.value })}
              onBlur={handleMailTitleBlur}
            />
            <TextInput
              label="메일 비고"
              value={value.mailNote}
              onChange={(e) => onChange({ mailNote: e.target.value })}
            />
          </div>

          {/* 중복 의심 경고 — 메일 제목과 매칭되는 행이 시트에 이미 있을 때 */}
          {duplicates.length > 0 && (
            <div className={styles.dupWarning}>
              <strong>⚠ 메일 제목이 동일한 업무 요청 {duplicates.length}건이 등록되어 있습니다.</strong>
              <ul>
                {duplicates.slice(0, 5).map((d) => (
                  <li key={d.id}>
                    {d.advertiser}
                    {d.category ? ` · ${d.category}` : ''}
                    {d.note ? ` · ${d.note}` : ''}
                    {d.designer ? ` · ${d.designer}` : ''}
                    {d.requester ? ` (${d.requester})` : ''}
                  </li>
                ))}
              </ul>
              {duplicates.length > 5 && (
                <span className={styles.dupMore}>외 {duplicates.length - 5}건</span>
              )}
            </div>
          )}
        </div>

        {/* 팀 — 1팀/2팀 칩 + 직접 입력 (인라인). 필수. */}
        <div>
          <span className={styles.fieldLabel}>
            팀
            {!validation.team && <span className={styles.requiredDot} aria-label="필수" />}
          </span>
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

        {/* 광고주 — 팀별 후보 + 더보기 + 직접 입력. 팀 미선택이면 비활성 칩. 필수. */}
        <div>
          <span className={styles.fieldLabel}>
            광고주
            {!validation.advertiser && <span className={styles.requiredDot} aria-label="필수" />}
          </span>
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
