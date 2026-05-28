// ============================================================
// hub-api.gs (v0.10) — design-team-hub 전용 Web App (standalone)
//
// v0.10 변경 — list 액션 추가:
//   doGet/doPost 모두 action=list 지원.
//   시트의 데이터 행 전부를 JSON 배열로 응답.
//   색칠 → 날짜 추출 (빨강=receivedDate, 가장 오른쪽 핑크=deadline).
//   메모 분리 (\n\n 기준 mailTitle / mailNote).
//   GET 지원 — 폴링 시 CORS preflight 없음, 디버깅 편함.
//
// v0.9 — checkDuplicates 응답에 rowCount 추가
// v0.8 — batch 단위 dedupe
// v0.7 — 초기 상태 조건부 (대기/예정)
// v0.6 — 등록 후 자동 정렬
// v0.5.x — 색칠·매칭·batch 최적화
// ============================================================

const HUB_SPREADSHEET_ID = '1-zGcP9ao6qGjNXRAijxU9rOar88bHIZHw_HKleBc2Ys';

// ▶ 첫 운영용 — 검증 끝나면 '💛신규·유지보수'로 교체
const HUB_TARGET_SHEET = '💛신규·유지보수_TEST';

const HUB_DATA_START_ROW = 10;
const HUB_DATE_HEADER_ROW = 9;
const HUB_DATE_START_COL = 14;

const HUB_COL = {
  타입: 2, 팀: 3, 요청자: 4, 광고주: 5, 작업자: 6,
  온오프: 7, 작업유형: 8, 수량: 9, 비고: 10,
  상태: 11, id: 12, 공유: 13,
};

const HUB_WRITE_COL_START = HUB_COL.타입;
const HUB_WRITE_COL_SPAN = HUB_COL.공유 - HUB_COL.타입 + 1;

const HUB_DUE_COLOR_PINK    = '#ffdcef';
const HUB_REQ_COLOR_RED     = '#ff0000';
const HUB_OFFDAY_COLOR_GRAY = '#efefef';
const HUB_DEFAULT_COLOR     = '#ffffff';

// ============================================================
// 엔트리포인트
// ============================================================

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';
    if (action === 'list') return jsonResponse(listSchedules());
    return jsonResponse({ error: 'unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (body.action === 'create') return jsonResponse(createSchedule(body.form));
    if (body.action === 'check-duplicates') return jsonResponse(checkDuplicates(body));
    if (body.action === 'list') return jsonResponse(listSchedules());
    return jsonResponse({ error: 'unknown action: ' + body.action });
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack });
  }
}

// ============================================================
// list — 시트 데이터 행 전부를 JSON 배열로 (v0.10)
// ============================================================

function listSchedules() {
  const sheet = SpreadsheetApp.openById(HUB_SPREADSHEET_ID).getSheetByName(HUB_TARGET_SHEET);
  if (!sheet) return { error: '시트 없음: ' + HUB_TARGET_SHEET };

  const lastRow = sheet.getLastRow();
  if (lastRow < HUB_DATA_START_ROW) {
    return { ok: true, rows: [], sheetName: HUB_TARGET_SHEET, fetchedAt: new Date().toISOString() };
  }

  const dataRowCount = lastRow - HUB_DATA_START_ROW + 1;
  const lastCol = sheet.getLastColumn();

  // 메인 데이터 영역 (B~M)
  const dataRange = sheet.getRange(HUB_DATA_START_ROW, 1, dataRowCount, HUB_COL.공유);
  const values = dataRange.getValues();
  const memos = sheet.getRange(HUB_DATA_START_ROW, HUB_COL.비고, dataRowCount, 1).getNotes();

  // 날짜 헤더 (9행) — 색칠 컬럼 → 날짜 매핑용
  const dateHeader = sheet.getRange(
    HUB_DATE_HEADER_ROW, HUB_DATE_START_COL, 1, lastCol - HUB_DATE_START_COL + 1
  ).getValues()[0];

  // 색칠 영역 (N~끝)
  const backgrounds = sheet.getRange(
    HUB_DATA_START_ROW, HUB_DATE_START_COL, dataRowCount, lastCol - HUB_DATE_START_COL + 1
  ).getBackgrounds();

  const rows = [];
  for (let i = 0; i < dataRowCount; i++) {
    const row = values[i];
    const id = String(row[HUB_COL.id - 1] || '');
    const advertiser = String(row[HUB_COL.광고주 - 1] || '');

    // 완전히 빈 행 스킵 (ID·광고주 둘 다 없으면 데이터 아님)
    if (!id && !advertiser) continue;

    // 색칠 → 날짜 매핑
    const rowBg = backgrounds[i];
    let receivedColOffset = -1;
    let deadlineColOffset = -1;
    for (let c = 0; c < rowBg.length; c++) {
      const bg = String(rowBg[c] || '').toLowerCase();
      if (bg === HUB_REQ_COLOR_RED) receivedColOffset = c;
      if (bg === HUB_DUE_COLOR_PINK) deadlineColOffset = c;  // 가장 오른쪽 핑크가 남음
    }

    const receivedDate = receivedColOffset >= 0 ? formatHeaderDate(dateHeader[receivedColOffset]) : '';
    const deadline = deadlineColOffset >= 0 ? formatHeaderDate(dateHeader[deadlineColOffset]) : '';

    // 메모 분리 (메일제목 \n\n 메일비고)
    const memoFull = memos[i][0] || '';
    const memoParts = memoFull.split('\n\n');
    const mailTitle = memoParts[0] || '';
    const mailNote = memoParts.slice(1).join('\n\n');

    rows.push({
      row: HUB_DATA_START_ROW + i,
      id: id,
      type: String(row[HUB_COL.타입 - 1] || ''),
      team: String(row[HUB_COL.팀 - 1] || ''),
      requester: String(row[HUB_COL.요청자 - 1] || ''),
      advertiser: advertiser,
      designer: String(row[HUB_COL.작업자 - 1] || ''),
      channel: String(row[HUB_COL.온오프 - 1] || ''),
      category: String(row[HUB_COL.작업유형 - 1] || ''),
      quantity: row[HUB_COL.수량 - 1] === '' ? null : row[HUB_COL.수량 - 1],
      note: String(row[HUB_COL.비고 - 1] || ''),
      mailTitle: mailTitle,
      mailNote: mailNote,
      status: String(row[HUB_COL.상태 - 1] || ''),
      shared: !!row[HUB_COL.공유 - 1],
      receivedDate: receivedDate,
      deadline: deadline,
    });
  }

  return {
    ok: true,
    rows: rows,
    sheetName: HUB_TARGET_SHEET,
    fetchedAt: new Date().toISOString(),
  };
}

// 헤더 셀 값 → 'YYYY-MM-DD' (헤더에 연도가 없으면 오늘 연도 추정)
function formatHeaderDate(v) {
  if (!v) return '';
  if (v instanceof Date) {
    return Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  if (typeof v === 'string') {
    const m = v.replace(/\n.*/, '').match(/(\d+)\/(\d+)/);
    if (m) {
      const y = new Date().getFullYear();
      const mm = String(parseInt(m[1], 10)).padStart(2, '0');
      const dd = String(parseInt(m[2], 10)).padStart(2, '0');
      return y + '-' + mm + '-' + dd;
    }
  }
  return '';
}

// ============================================================
// createSchedule — 폼에서 받은 batch를 시트에 기록 (v0.5.x~)
// ============================================================

function createSchedule(form) {
  if (!form) return { error: 'form 누락' };
  if (!form.team || !form.advertiser || !form.requestDate || !form.deadline) {
    return { error: '필수 항목 누락 (team/advertiser/requestDate/deadline)' };
  }
  if (!Array.isArray(form.groups) || form.groups.length === 0) {
    return { error: '그룹 없음' };
  }

  const sheet = SpreadsheetApp.openById(HUB_SPREADSHEET_ID).getSheetByName(HUB_TARGET_SHEET);
  if (!sheet) return { error: '시트 없음: ' + HUB_TARGET_SHEET };

  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (e) { return { error: 'busy', code: 'BUSY' }; }

  try {
    const requestDate = parseYmd(form.requestDate);
    const deadlineDate = parseYmd(form.deadline);
    const requestCol = findDateColumn(sheet, requestDate);
    const deadlineCol = findDateColumn(sheet, deadlineDate);

    if (requestCol === -1) return { error: '접수일 헤더 못 찾음: ' + form.requestDate };
    if (deadlineCol === -1) return { error: '마감일 헤더 못 찾음: ' + form.deadline };

    const startRow = Math.max(sheet.getLastRow(), HUB_DATA_START_ROW - 1) + 1;
    const scheduleType = form.scheduleType || '일반';
    const mailNote = buildMailNote(form.mailTitle, form.mailNote);
    const seenDesigners = {};

    const hasMailTitle = !!(form.mailTitle && form.mailTitle.trim());
    const initialStatus = hasMailTitle ? '대기' : '예정';

    const allRows = [];
    const allMemos = [];
    const ids = [];

    for (let g = 0; g < form.groups.length; g++) {
      const group = form.groups[g];
      for (let mi = 0; mi < group.materials.length; mi++) {
        const m = group.materials[mi];
        const row = new Array(HUB_WRITE_COL_SPAN).fill('');
        row[HUB_COL.타입 - HUB_WRITE_COL_START]      = scheduleType;
        row[HUB_COL.팀 - HUB_WRITE_COL_START]        = form.team;
        row[HUB_COL.요청자 - HUB_WRITE_COL_START]    = form.requester || '';
        row[HUB_COL.광고주 - HUB_WRITE_COL_START]    = form.advertiser;
        row[HUB_COL.작업자 - HUB_WRITE_COL_START]    = m.designer || '';
        row[HUB_COL.온오프 - HUB_WRITE_COL_START]    = group.channel || '';
        row[HUB_COL.작업유형 - HUB_WRITE_COL_START]  = formatWorkType(group.category, group.detail);
        row[HUB_COL.수량 - HUB_WRITE_COL_START]      = parseInt(m.quantity, 10) || 1;
        row[HUB_COL.비고 - HUB_WRITE_COL_START]      = m.note;
        row[HUB_COL.상태 - HUB_WRITE_COL_START]      = initialStatus;
        row[HUB_COL.id - HUB_WRITE_COL_START]        = m.id;
        row[HUB_COL.공유 - HUB_WRITE_COL_START]      = false;
        allRows.push(row);

        const designerKey = m.designer || '__미배정__';
        if (mailNote && !seenDesigners[designerKey]) {
          allMemos.push([mailNote]);
          seenDesigners[designerKey] = true;
        } else {
          allMemos.push(['']);
        }
        ids.push(m.id);
      }
    }

    const rowCount = allRows.length;
    sheet.getRange(startRow, HUB_WRITE_COL_START, rowCount, HUB_WRITE_COL_SPAN).setValues(allRows);
    sheet.getRange(startRow, HUB_COL.비고, rowCount, 1).setNotes(allMemos);
    sheet.getRange(startRow, HUB_COL.공유, rowCount, 1).insertCheckboxes();

    const lastCol = sheet.getLastColumn();
    const fullWidth = lastCol - HUB_DATE_START_COL + 1;
    const currentBgs = sheet.getRange(startRow, HUB_DATE_START_COL, rowCount, fullWidth).getBackgrounds();
    const newBgs = [];
    for (let r = 0; r < rowCount; r++) {
      const rowBg = currentBgs[r];
      const next = new Array(fullWidth);
      for (let c = 0; c < fullWidth; c++) {
        const absCol = HUB_DATE_START_COL + c;
        const bg = String(rowBg[c] || '').toLowerCase();
        if (bg === HUB_OFFDAY_COLOR_GRAY) {
          next[c] = HUB_OFFDAY_COLOR_GRAY;
        } else if (absCol === requestCol) {
          next[c] = HUB_REQ_COLOR_RED;
        } else if (absCol > requestCol && absCol <= deadlineCol) {
          next[c] = HUB_DUE_COLOR_PINK;
        } else {
          next[c] = HUB_DEFAULT_COLOR;
        }
      }
      newBgs.push(next);
    }
    sheet.getRange(startRow, HUB_DATE_START_COL, rowCount, fullWidth).setBackgrounds(newBgs);

    sortSheet(sheet);
    return { ok: true, rowsCreated: rowCount, ids: ids };
  } finally {
    lock.releaseLock();
  }
}

function sortSheet(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= HUB_DATA_START_ROW) return;

  const dataRowCount = lastRow - HUB_DATA_START_ROW + 1;
  const lastCol = sheet.getLastColumn();

  const dataRange = sheet.getRange(HUB_DATA_START_ROW, 1, dataRowCount, lastCol);
  const values = dataRange.getValues();
  const backgrounds = dataRange.getBackgrounds();
  const memoRange = sheet.getRange(HUB_DATA_START_ROW, HUB_COL.비고, dataRowCount, 1);
  const memos = memoRange.getNotes();

  const rows = values.map(function(row, idx) {
    const bg = backgrounds[idx];
    let requestColIdx = -1;
    let deadlineColIdx = -1;
    for (let c = HUB_DATE_START_COL - 1; c < lastCol; c++) {
      const cellBg = String(bg[c] || '').toLowerCase();
      if (cellBg === HUB_REQ_COLOR_RED) requestColIdx = c;
      if (cellBg === HUB_DUE_COLOR_PINK) deadlineColIdx = c;
    }
    return {
      values: row,
      backgrounds: bg,
      memo: memos[idx][0] || '',
      advertiser: String(row[HUB_COL.광고주 - 1] || ''),
      requestColIdx: requestColIdx,
      deadlineColIdx: deadlineColIdx,
    };
  });

  const validRows = rows.filter(function(r) {
    return r.deadlineColIdx !== -1 || r.requestColIdx !== -1;
  });
  const emptyRows = rows.filter(function(r) {
    return r.deadlineColIdx === -1 && r.requestColIdx === -1;
  });

  function cmpCol(a, b) {
    if (a === -1 && b === -1) return 0;
    if (a === -1) return 1;
    if (b === -1) return -1;
    return a - b;
  }
  validRows.sort(function(a, b) {
    return cmpCol(a.deadlineColIdx, b.deadlineColIdx) ||
           cmpCol(a.requestColIdx, b.requestColIdx);
  });

  let i = 0;
  while (i < validRows.length) {
    let j = i + 1;
    while (j < validRows.length &&
           validRows[j].deadlineColIdx === validRows[i].deadlineColIdx &&
           validRows[j].requestColIdx === validRows[i].requestColIdx) {
      j++;
    }
    if (j - i > 1) {
      const sub = validRows.slice(i, j);
      const firstSeen = {};
      for (let k = 0; k < sub.length; k++) {
        const adv = sub[k].advertiser;
        if (!(adv in firstSeen)) firstSeen[adv] = k;
      }
      sub.sort(function(a, b) {
        return firstSeen[a.advertiser] - firstSeen[b.advertiser];
      });
      for (let k = 0; k < sub.length; k++) {
        validRows[i + k] = sub[k];
      }
    }
    i = j;
  }

  const sorted = validRows.concat(emptyRows);

  dataRange.setValues(sorted.map(function(r) { return r.values; }));
  dataRange.setBackgrounds(sorted.map(function(r) { return r.backgrounds; }));
  memoRange.setNotes(sorted.map(function(r) { return [r.memo]; }));
  sheet.getRange(HUB_DATA_START_ROW, HUB_COL.공유, dataRowCount, 1).insertCheckboxes();
}

// ============================================================
// checkDuplicates — batch 단위 dedupe + 각 batch의 rowCount 응답 (v0.9)
// ============================================================
function checkDuplicates(body) {
  const raw = (body && body.mailTitle) || '';
  const queryNorm = normalizeMailTitle(raw);
  if (!queryNorm) return { matches: [] };

  const sheet = SpreadsheetApp.openById(HUB_SPREADSHEET_ID).getSheetByName(HUB_TARGET_SHEET);
  if (!sheet) return { error: '시트 없음: ' + HUB_TARGET_SHEET };

  const lastRow = sheet.getLastRow();
  if (lastRow < HUB_DATA_START_ROW) return { matches: [] };

  const dataRowCount = lastRow - HUB_DATA_START_ROW + 1;
  const range = sheet.getRange(HUB_DATA_START_ROW, 1, dataRowCount, HUB_COL.id);
  const values = range.getValues();
  const memos = sheet.getRange(HUB_DATA_START_ROW, HUB_COL.비고, dataRowCount, 1).getNotes();

  // batch별 총 행 수 미리 계산 (전체 시트 ID 스캔)
  const batchTotalCounts = {};
  for (let i = 0; i < dataRowCount; i++) {
    const id = String(values[i][HUB_COL.id - 1] || '');
    if (!id) continue;
    const key = extractBatchKey(id);
    batchTotalCounts[key] = (batchTotalCounts[key] || 0) + 1;
  }

  // 1단계: 정규화 후 완전 일치한 행 모두 수집
  const matchedRows = [];
  for (let i = 0; i < dataRowCount; i++) {
    const memo = (memos[i][0] || '');
    if (!memo) continue;
    const memoTitle = memo.split('\n\n')[0];
    if (!memoTitle) continue;
    const memoNorm = normalizeMailTitle(memoTitle);
    if (!memoNorm) continue;

    if (memoNorm === queryNorm) {
      matchedRows.push({
        id: String(values[i][HUB_COL.id - 1] || ''),
        advertiser: String(values[i][HUB_COL.광고주 - 1] || ''),
        requester: String(values[i][HUB_COL.요청자 - 1] || ''),
        designer: String(values[i][HUB_COL.작업자 - 1] || ''),
        category: String(values[i][HUB_COL.작업유형 - 1] || ''),
        note: String(values[i][HUB_COL.비고 - 1] || ''),
        mailTitle: memoTitle,
      });
    }
  }

  // 2단계: batch ID prefix로 dedupe + rowCount 부착
  const seenBatch = {};
  const matches = [];
  for (let i = 0; i < matchedRows.length; i++) {
    const row = matchedRows[i];
    const key = extractBatchKey(row.id);
    if (seenBatch[key]) continue;
    seenBatch[key] = true;
    matches.push({
      id: row.id,
      advertiser: row.advertiser,
      requester: row.requester,
      designer: row.designer,
      category: row.category,
      note: row.note,
      mailTitle: row.mailTitle,
      rowCount: batchTotalCounts[key] || 1,
    });
  }

  return { matches: matches };
}

function extractBatchKey(id) {
  if (!id) return '';
  if (id.length >= 10 && id.charAt(0) === 'b' && id.charAt(9) === '-') {
    return id.substring(0, 9);
  }
  return id;
}

function normalizeMailTitle(title) {
  if (!title) return '';
  return String(title)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\[\]().,;:!?\-_/]/g, '');
}

function buildMailNote(title, note) {
  const parts = [];
  if (title && title.trim()) parts.push(title.trim());
  if (note && note.trim()) parts.push(note.trim());
  return parts.join('\n\n');
}

function formatWorkType(category, detail) {
  if (!category) return '';
  return detail ? category + '(' + detail + ')' : category;
}

function parseYmd(s) {
  const parts = s.split('-').map(function(x) { return parseInt(x, 10); });
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function findDateColumn(sheet, target) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < HUB_DATE_START_COL) return -1;
  const values = sheet.getRange(HUB_DATE_HEADER_ROW, HUB_DATE_START_COL, 1, lastCol - HUB_DATE_START_COL + 1).getValues()[0];

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    let cellDate = null;
    if (v instanceof Date) {
      cellDate = v;
    } else if (typeof v === 'string') {
      const mm = v.replace(/\n.*/, '').match(/(\d+)\/(\d+)/);
      if (mm) cellDate = new Date(target.getFullYear(), parseInt(mm[1], 10) - 1, parseInt(mm[2], 10));
    }
    if (cellDate && cellDate.getMonth() === target.getMonth() && cellDate.getDate() === target.getDate()) {
      return HUB_DATE_START_COL + i;
    }
  }
  return -1;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
