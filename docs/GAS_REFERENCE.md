# GAS_REFERENCE.md — 위젯 레포 GAS 동작 미러링

> **이 문서는 코드 사본이 아니다.** 위젯 레포(`design-widget-schedule`)의 GAS 3개의 동작·계약·ID 사용 패턴을 design-team-hub 입장에서 참조하기 위한 요약.
>
> **원본 코드는 위젯 레포에만 존재.** 변경되면 이 문서도 같이 갱신 — 자동 동기화 X. 위젯 레포 GAS를 손볼 때 항상 이 문서를 같이 update.
>
> **작성 기준**: 2026-05-26 (위젯 v0.2.4 / Sync v2.1.0)

## 원본 경로

| 파일 | 위젯 레포 경로 |
|---|---|
| Scheduler.gs | https://github.com/Peekaboo325/design-widget-schedule/blob/main/legacy-gas/Scheduler.gs |
| Synccompletedtodatasheet.gs | https://github.com/Peekaboo325/design-widget-schedule/blob/main/legacy-gas/Synccompletedtodatasheet.gs |
| schedule-widget-api.gs | https://github.com/Peekaboo325/design-widget-schedule/blob/main/schedule-widget-api.gs |

---

## 1. Scheduler.gs (legacy-gas)

**책임**: 시트 onEdit 자동화 (공유 체크 → 완료 시트 이관, L열 ID 자동 발급, 캘린더 등록·동기화)

**핵심 함수**:
- `moveRowOnCheck(e)` — M열 공유 체크 시 행 → 완료 시트 이관 + TAT 계산. lock 사용.
- `onEditTrigger(e)` — 빈 L열 ID 자동 발급(`assignIdIfNeeded_`), K열 '미정→대기' 시 캘린더 단건 등록.
- `syncToCalendar()` — 시트 ↔ 캘린더 ID 기반 증분 sync. 캘린더 이벤트 hidden tag(`rowId`)에 시트 ID 박음.
- `sortCompleteSheet()` — 완료 시트 정렬 (마감일 → 광고주 → 비고[한글 우선]).
- `getKoreanHolidays(year)` — Google 공식 한국 공휴일 캘린더에서 fetch + 6시간 캐시.
- `getCompanyHolidays(year)` — `회사휴무일` 시트에서 fetch + 1시간 캐시.
- `isBusinessDay(date)` — 주말 + 한국 공휴일 + 회사 휴무일 모두 제외.

**시트 의존성**: 신규·유지보수(`💛신규·유지보수`), 완료(`💚완료`). 열 위치 하드코딩.

**ID 사용**: L열 UUID.
- `assignIdIfNeeded_`: **빈 셀에만 발급**. 이미 있는 ID 안 덮어씀.
- `moveRowOnCheck`: 이관 시 기존 ID 그대로 운반. 비었으면 새 발급.

**캘린더 의존성**:
- `ko.south_korea#holiday@group.v.calendar.google.com` (공휴일)
- `디자인팀 업무 스케줄러` (스케줄, 이름으로 매칭)

---

## 2. Synccompletedtodatasheet.gs (legacy-gas)

**책임**: 완료 시트 → 업무데이터 시트(**다른 파일!**) 일일 동기화. 단가·수치 계산 같이.

**핵심 함수**:
- `syncCompletedToDataSheet()` — 매일 9시 자동 실행. 중복 체크 후 신규 행 append.
- `setTimeTrigger()` — 9시 트리거 설정.
- `migrateDataSheetIds()` — 데이터 시트 R열 ID 배치 마이그레이션 (8000+ 행, 500행씩 + 6분 제한 대응 + 진행 상태 저장/재개).
- `resetMigrateDataSheetIdsProgress()` — 마이그레이션 진행 상태 리셋.
- `buildExistingKeys(dataSheet)` — 중복 체크용 key set 구성 (ID set + 4-field fallback set).

**시트 의존성**:
- 완료 시트(`💚완료`) — 위젯 파일.
- 업무데이터 시트(`업무데이터`) — **별도 파일** `1KukGD6VbYDHYx7vfFBs4P7-OVZFAuV97wneIQCzR7Ng`.

**ID 사용**: 완료 시트 L열 ID → 업무데이터 시트 **R열**로 운반.
- 중복 체크: **ID 우선** (`idSet.has(String(id))`), 없으면 4-field fallback(광고주|작업유형|비고|완료일).
- `idSet`는 단순 `Set<string>` — UUID 형식 검증 X.

**단가 테이블**: 80+ 종류. KV(프리미엄) 500,000 ~ 사이즈베리(미니) 2,500 등.

**중요**: 단가 테이블 키가 시트의 작업유형 문자열과 정확히 일치해야 — 새 종류 추가 시 단가 테이블도 같이 갱신.

---

## 3. schedule-widget-api.gs

**책임**: 위젯 클라이언트용 Web App. GET=조회, POST=상태/공유/백업 토글.

**핵심 함수**:
- `doGet(e)` — `type=members` (팀원 목록), `type=schedule&member=이름` (그 팀원 일정+공유대기+백업+요약).
- `doPost(e)` — `action=setStatus|setShare|setBackup`. lock 사용.
- `findRowByIdInSheet(sheet, id, idCol)` — ID로 행 lookup (`String(...) === id` equality).
- `getBackupRows(member)` — 완료 시트에서 그 팀원 백업 미체크 행.
- `widgetMigrateScheduleIds()` / `widgetMigrateCompletedIds()` — 기존 행 ID 일괄 발급(1회 실행).

**시트 의존성**: 신규·유지보수, 완료 (열 위치 + 색깔 기반: 핑크 `#ffdcef`=마감일, 빨강 `#ff0000`=요청일).

**ID 사용**:
- `doPost`에서 **ID 우선 lookup**. 없으면 rowIndex + expect(광고주/비고) fallback.
- GET 시 빈 ID 자동 백필 (onEdit이 못 잡은 행 안전망).
- 응답에 `id` 필드 포함 → 위젯이 ID 기반 행 식별 (rowIndex 시프트에 안전).

**팀원 명단 하드코딩**: `WIDGET_MEMBERS = ['부수빈', '이소빈', '조희주', '강진이', '김수현', '서아라']`. 디자이너 변경 시 여기도 같이 수정.

---

## ID lifecycle 한눈에

```
[design-team-hub 신규 등록]                  ← (예정) batch_id 미리 박아서 전송
        │
        ▼
[신규·유지보수 L열]
   ├─ 우리가 박은 ID 그대로 (Scheduler가 안 덮어씀)
   └─ 또는 onEditTrigger.assignIdIfNeeded_가 빈 셀에 UUID 발급
        │
        │ 공유 체크 → moveRowOnCheck
        ▼
[완료 시트 L열] (ID 그대로 이관)
        │
        │ 매일 9시 → syncCompletedToDataSheet
        ▼
[업무데이터 R열] (ID 그대로 이관, 다른 파일)
        │
        │ syncToCalendar (Scheduler) — 같은 ID로 캘린더 이벤트 tag 매칭
        ▼
[Google Calendar 이벤트 tag=rowId]
```

각 단계에서 ID는 **그저 stable string identifier**. UUID 형식 검증 안 함.

---

## ID 형식 — design-team-hub batch_id 호환성

**3개 GAS 모두 string equality로만 ID 비교** → design-team-hub가 `bA3F7B2C-001` 같은 batch prefix 형식을 박아도 모든 GAS와 호환됨.

GAS 코드 수정 없이 batch 식별 가능. 단 미래 변경 시 이 가정 깨지지 않게 주의.

**현재 박는 형식**: `b{8자 hex}-{3자리 idx}`
- 예: `bA3F7B2C-001`, `bA3F7B2C-002`, ... (한 폼에서 등록된 행들은 같은 prefix 공유)
- 생성 위치: `src/types.ts`의 `normalizeFormForSubmit` (등록 정규화 단계)
- 한 batch에 ≤ 999행 (3자리 idx). 한 폼에서 그 이상 등록할 일 없음.
- 8자 hex 충돌 확률 ≈ 1/4억. 한 팀 연 1000건 등록해도 사실상 0.

**유의**: GAS 측에서 자동 발급되는 UUID는 표준 형식(`xxxxxxxx-xxxx-...`)이고, design-team-hub에서 박는 것은 `bXXXX-NNN` 형식. **혼재 가능**. 코드 둘 다 처리 OK.

---

## 일원화 후 GAS 정리 검토 (중장기)

design-team-hub가 신규 등록의 **유일한 입력 폼**이 되면, GAS 측의 ID 자동발급 로직은 redundant:

| GAS 함수 | 현재 역할 | 일원화 후 |
|---|---|---|
| `Scheduler.assignIdIfNeeded_` | 빈 L열에 onEdit UUID 발급 | redundant (우리가 미리 박음) — **삭제 검토** |
| `schedule-widget-api.gs` GET 시 빈 ID 백필 | 위젯 조회 시 빈 L열에 UUID 발급 | redundant — **삭제 검토** |
| `widgetMigrateScheduleIds` / `widgetMigrateCompletedIds` | 기존 행 일괄 마이그레이션 (1회 실행) | 이미 1회로 끝난 작업 — 그대로 두거나 archive |
| `Synccompletedtodatasheet.migrateDataSheetIds` | 데이터 시트 R열 8000+행 배치 마이그레이션 | 이미 1회 실행. 그대로 두거나 archive |

**다만 안전 위해 일원화 후에도 자동발급 로직은 즉시 삭제 X.** 사람이 시트 직접 편집해서 새 행 만드는 케이스(완전 일원화 못한 동안의 잔여 동선)가 있을 수 있어 안전망으로 유지. 일원화가 검증되고 운영자가 시트 직접 편집을 안 하는 게 확정되면 정리.

---

## design-team-hub와의 상호작용 (예정)

| 동선 | 방향 | 사용 GAS |
|---|---|---|
| 신규 스케줄 등록 | design-team-hub → 신규·유지보수 시트 | (신규 endpoint 필요) |
| 행 편집 | design-team-hub ↔ 신규·유지보수/완료 시트 | (신규 endpoint 필요) |
| 행 조회 (시트 뷰) | design-team-hub ← 시트 | (신규 endpoint 또는 기존 doGet 재사용) |
| 공휴일 동적 fetch | design-team-hub ← Google 캘린더 (GAS proxy) | (신규 endpoint 필요) |
| 디자이너 일정 보기 (위젯 본인 작업) | 위젯 ← schedule-widget-api.gs | 기존 |

**GAS URL 갱신 시**: design-team-hub의 GAS URL 상수와 위젯/대시보드 양쪽 모두 동시 갱신 (`DATA_CONTRACT.md` §5 참조).

---

## 갱신 책임

- 위젯 레포 GAS가 변경되면 **이 문서를 함께 갱신**.
- 변경 항목: 함수 시그니처, 시트 컬럼 의존성, ID 처리 방식, 단가 테이블, 팀원 명단.
- 잘못된 정보가 박혀 있으면 다음에 손볼 때 시간 낭비 → 정확성 유지 필수.

---

*위젯/대시보드/허브 세 레포의 단일 진실 원천(single source of truth)은 각자 자기 레포에 있다. 이 문서는 design-team-hub에서 GAS를 이해·참조하기 위한 거울이지, 코드 자체가 아니다.*
