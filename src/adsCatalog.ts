// 광고 스크립트 카탈로그
// ------------------------------------------------------------------
// src/ads/ 아래에 날짜별로 쌓인 광고 스크립트를 스캔해서
// "업체 / 광고태그" 기준으로 분류할 수 있도록 메타데이터를 뽑아낸다.
//
// 폴더 구조가 시기별로 다르다.
//  - 구버전: src/ads/YYYYMMDD_작업내용/{업체prefix}_{yyyymm}_{슬롯코드}_{yymmdd}.js
//  - 신버전: src/ads/YYYYMMDD_작업내용/{업체명}/{광고태그(xxx@yyy)}/파일.js
//
// 자동 분류는 완벽하지 않다. 아래 COMPANY_RULES / 태그 추출 규칙을 고치면
// 분류 정확도를 올릴 수 있고, 매칭이 안 되는 항목은 '미분류'로 모인다.
// 원본 경로(fullPath)를 항상 함께 노출하므로 오분류는 눈으로 확인·교정할 수 있다.

// Vite: 광고 스크립트 원본을 lazy 로 불러오기 위한 raw glob.
//  key   = './ads/…/파일.js'  (모듈 기준 상대경로)
//  value = () => Promise<string>  (파일 내용)
const rawLoaders = import.meta.glob('./ads/**/*.{js,txt,html}', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

export type AdTagKind = 'slot' | 'code' | 'none'

export interface AdScriptEntry {
  /** glob key. 원본을 불러올 때 사용하는 고유 id. */
  id: string
  /** src/ads/ 기준 사람이 읽는 경로. */
  fullPath: string
  fileName: string
  ext: string
  /** YYYY-MM-DD (최상위 날짜 폴더에서 추출). 알 수 없으면 ''. */
  date: string
  /** 최상위 폴더에서 날짜를 뺀 작업 설명. */
  work: string
  /** 날짜 폴더와 파일명 사이의 중간 폴더들. */
  segments: string[]
  company: string
  adTag: string
  adTagKind: AdTagKind
  /** backup/test/copy/예시/참고 등 보조 파일 여부. */
  isAux: boolean
  /** 이 파일(메인)에 딸린 백업 파일들. 같은 폴더/이름의 backup 파일이 여기로 묶인다. */
  backups: AdScriptEntry[]
  /** 다른 메인 파일에 백업으로 묶인 경우 true(개별 목록에서는 숨기고 팝업으로만 노출). */
  isAttachedBackup: boolean
}

// ── 업체(광고 매체·대행사) 분류 규칙 ────────────────────────────────
// 위에서부터 순서대로 검사하며, 파일 경로 전체(소문자)에 keyword 가 있으면 label 로 확정.
// 필요하면 자유롭게 추가/수정하세요. (한글 업체 폴더명은 그대로 우선 인식됩니다.)
const COMPANY_RULES: { keyword: string; label: string }[] = [
  // criteo 는 nh_criteo 처럼 인하우스 접두사가 붙어도 크리테오로 본다(항상 최우선).
  { keyword: 'criteo', label: '크리테오' },
  { keyword: '크리테오', label: '크리테오' },
  { keyword: 'naverlink', label: '네이버 파워링크' },
  { keyword: '네이버파워링크', label: '네이버 파워링크' },
  { keyword: '네이버 파워링크', label: '네이버 파워링크' },
  { keyword: 'taboola', label: '타불라' },
  { keyword: '타불라', label: '타불라' },
  { keyword: 'adpopcorn', label: '애드팝콘' },
  { keyword: 'admob', label: '애드몹(구글)' },
  { keyword: 'adpop', label: '애드팝콘' },
  { keyword: 'nextpaper', label: '넥스트페이퍼엠앤씨' },
  { keyword: 'nextback', label: '넥스트페이퍼엠앤씨' },
  { keyword: '넥스트페이퍼', label: '넥스트페이퍼엠앤씨' },
  { keyword: '싱크미디어', label: '싱크미디어' },
  { keyword: 'syncmedia', label: '싱크미디어' },
  { keyword: '@sync', label: '싱크미디어' },
  { keyword: '테크랩스', label: '테크랩스' },
  { keyword: '모비온', label: '모비온' },
  { keyword: 'mobon', label: '모비온' },
  // 엠아이디파트너스: newsmid_ / mainbt_ / replace_ / bodab_ / cozy / adbc / subbt 계열.
  { keyword: '엠아이디파트너스', label: '엠아이디파트너스' },
  { keyword: 'newsmid', label: '엠아이디파트너스' },
  { keyword: 'mainbt', label: '엠아이디파트너스' },
  { keyword: 'replace', label: '엠아이디파트너스' },
  { keyword: 'bodab', label: '엠아이디파트너스' },
  { keyword: 'cozy', label: '엠아이디파트너스' },
  { keyword: 'adbc', label: '엠아이디파트너스' },
  { keyword: 'subbt', label: '엠아이디파트너스' },
  { keyword: 'cbcnews', label: 'CBC뉴스' },
  { keyword: '와이더플래닛', label: '와이더플래닛' },
  { keyword: 'wider', label: '와이더플래닛' },
  { keyword: 'ktnasmedia', label: '케이티나스미디어' },
  // nh_shopbox_2025* 는 인하우스가 아니라 애드온(아래 nh_ 규칙보다 먼저 검사).
  { keyword: 'nh_shopbox_2025', label: '애드온' },
  { keyword: 'adon', label: '애드온' },
  { keyword: '3dpop', label: '싱크미디어' },
  { keyword: '라이나', label: '퍼포먼스바이TBWA' },
  { keyword: 'network', label: 'RTB네트웍' },
  { keyword: '네트웍', label: 'RTB네트웍' },
  { keyword: 'nateview', label: '구글' },
  { keyword: 'dmp', label: 'DMP' },
  { keyword: '데이블', label: '데이블' },
  { keyword: 'dable', label: '데이블' },
  { keyword: '아티스트컴퍼니', label: '아티스트컴퍼니' },
  { keyword: 'edl', label: '이디엘' },
  { keyword: '이디엘', label: '이디엘' },
  // jaedan 계열은 더블에스코어.
  { keyword: 'jaedan', label: '더블에스코어' },
  { keyword: 'cp_', label: '쿠팡' },
  { keyword: 'coupang', label: '쿠팡' },
  { keyword: '쿠팡', label: '쿠팡' },
  { keyword: 'genius', label: '지니어스컴' },
  { keyword: 'nutrione', label: '뉴트리원' },
  { keyword: 'ohou', label: '버킷플레이스' },
  { keyword: 'nhn tx', label: 'NHN TX' },
  { keyword: '인하우스', label: '인하우스' },
  { keyword: 'house', label: '인하우스' },
  { keyword: 'nh_', label: '인하우스' },
  { keyword: 'google', label: '구글' },
  { keyword: '구글', label: '구글' },
  { keyword: 'ori_', label: '오리지네이터' },
]

/** 규칙에 정의된 정규 업체 목록(등장 순서, 중복 제거). 업체 탭 등에 사용. */
export const CANONICAL_COMPANIES: string[] = (() => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const rule of COMPANY_RULES) {
    if (!seen.has(rule.label)) {
      seen.add(rule.label)
      out.push(rule.label)
    }
  }
  return out
})()

const CANONICAL_COMPANY_SET = new Set(CANONICAL_COMPANIES)

/** 정규 업체(규칙으로 확정된 업체)인지 여부. 그 외(파일명 접두사 fallback)는 false. */
export function isCanonicalCompany(label: string): boolean {
  return CANONICAL_COMPANY_SET.has(label)
}

// 태그/파일명에서 나오지만 업체가 아닌, 무시할 중간 폴더 이름들.
const NON_COMPANY_SEGMENTS = new Set([
  'backup',
  'test',
  'ex',
  'new',
  '참고',
  '선행',
  '적용',
  'as-is',
  'to-be',
  '점검중 애즈',
  '뉴스',
  '메인',
  '판',
])

function normalize(value: string): string {
  return value.toLowerCase()
}

/** 한글 업체 폴더명을 그대로 인식(이디엘/테크랩스 등). @태그·백업 폴더는 제외. */
function koreanCompanyFolder(segment: string): string | null {
  if (!/[가-힣]/.test(segment)) return null
  if (segment.includes('@')) return null
  if (NON_COMPANY_SEGMENTS.has(segment)) return null
  // 위치/작업 설명성 폴더(예: '메인중단빅배너_main@mid_Top3')는 @ 로 걸러진다.
  return segment
}

function detectCompany(segments: string[], fileName: string): string {
  // 1) 중간 폴더에 한글 업체명이 있으면 최우선.
  for (const seg of segments) {
    const ko = koreanCompanyFolder(seg)
    if (ko) return ko
  }
  // 2) 경로 전체를 키워드로 매칭.
  const haystack = normalize([...segments, fileName].join('/'))
  for (const rule of COMPANY_RULES) {
    if (haystack.includes(rule.keyword)) return rule.label
  }
  // 3) 파일명 맨 앞 토큰이라도 그룹핑에 쓴다(같은 접두사끼리 묶임).
  const lead = fileName
    .replace(/\.(js|txt|html)$/i, '')
    .replace(/^(backup|백업\d?|test|참고|예시|샘플|sample|replace)[_. ]/i, '')
    .split(/[_.@ ]/)[0]
  if (lead && /[a-zA-Z가-힣]/.test(lead)) return lead
  return '미분류'
}

// 이름@지면_포지션 전체를 캡처(포지션·지면 안의 '_' 포함). 예: news@view2_middle3, news@r_blank_x24
const AT_TAG_RE = /([A-Za-z0-9]+@[A-Za-z0-9가-힣_]+)/
const SLOT_CODE_RE = /^[MNVDB][a-z][A-Za-z0-9]{2,}$/

function detectAdTag(segments: string[], fileName: string): { tag: string; kind: AdTagKind } {
  // 1) 신버전: 이름@지면_포지션 형태의 광고 슬롯 태그(포지션까지 전체).
  const hay = [...segments, fileName].join('/')
  const at = hay.match(AT_TAG_RE)
  if (at) {
    // 원본 대소문자 보존(Top3/Bottom2/Middle3 등). 끝의 날짜(_YYMMDD)만 제거.
    const tag = at[1].replace(/_\d{5,6}$/, '')
    return { tag, kind: 'slot' }
  }

  // 2) 구버전: 파일명 속 슬롯 코드(Msubrt, Nnsbtcont, Vtshop 등).
  const parts = fileName.replace(/\.(js|txt|html)$/i, '').split(/[_ ]+/)
  for (const part of parts) {
    if (SLOT_CODE_RE.test(part)) return { tag: part, kind: 'code' }
  }
  return { tag: '미분류', kind: 'none' }
}

/** 광고 스크립트가 아닌 참고/미리보기 파일(html·태그없는 txt)을 묶는 클러스터 이름. */
export const MISC_GROUP = '기타'

const AUX_RE = /(backup|copy|test|샘플|sample|예시|참고|선행|as-is|to-be|_ex\b|\bex\b|백업)/i

function isAuxFile(fullPath: string, fileName: string): boolean {
  // 'nh_test' 는 인하우스 광고 네이밍(테스트 파일 아님)이라 test 판정에서 제외.
  const strip = (s: string) => s.replace(/nh_test/gi, 'nh')
  return AUX_RE.test(strip(fullPath)) || AUX_RE.test(strip(fileName))
}

function parseEntry(id: string): AdScriptEntry {
  // id: './ads/20240614_숏폼하단/admob_..._Msform_40601.js'
  const rel = id.replace(/^\.\/ads\//, '')
  const parts = rel.split('/')
  const topFolder = parts[0] ?? ''
  const fileName = parts[parts.length - 1] ?? rel
  const segments = parts.slice(1, -1)

  const dateMatch = topFolder.match(/^(\d{4})(\d{2})(\d{2})/)
  const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : ''
  const work = topFolder.replace(/^\d{8}[_ ]?/, '') || topFolder

  const extMatch = fileName.match(/\.([^.]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : ''

  const rawCompany = detectCompany(segments, fileName)
  const { tag: rawTag, kind: rawKind } = detectAdTag(segments, fileName)

  // 실제 광고 스크립트가 아닌 참고/미리보기 파일(html 전부, 태그 없는 txt)은 '기타' 클러스터로.
  const isMisc = ext === 'html' || (ext === 'txt' && rawTag === '미분류')
  const company = isMisc ? MISC_GROUP : rawCompany
  const adTag = isMisc ? MISC_GROUP : rawTag
  const adTagKind: AdTagKind = isMisc ? 'none' : rawKind

  return {
    id,
    fullPath: rel,
    fileName,
    ext,
    date,
    work,
    segments,
    company,
    adTag,
    adTagKind,
    isAux: isAuxFile(rel, fileName),
    backups: [],
    isAttachedBackup: false,
  }
}

// ── 백업 파일 → 메인 파일 연결 ─────────────────────────────────
// 'backup' 폴더 안에 있는 파일만 백업으로 본다(파일명이 같다고 백업 처리하지 않음).
// 같은 작업 폴더에서 파일명이 같은 메인을 찾아 backups 로 묶고,
// 묶인 백업은 개별 목록에서 숨기고 메인 카드의 아이콘/팝업으로만 노출.

/** 파일이 백업인지 = 경로에 'backup' 폴더가 있는지. (이름 표식·copy 는 백업으로 보지 않음) */
function isBackupEntry(entry: AdScriptEntry): boolean {
  return entry.segments.some((s) => /^backup$/i.test(s))
}

/** 짝 맞추기용 파일명 키(소문자). 백업은 메인과 파일명이 동일하므로 그대로 비교. */
function matchName(entry: AdScriptEntry): string {
  return entry.fileName.toLowerCase()
}

/** 정밀 키: backup 폴더를 소유한 폴더 + 파일명. 바로 옆(같은 폴더)의 메인을 우선 매칭. */
function strictPairKey(entry: AdScriptEntry): string {
  const dir = entry.fullPath.replace(/\/[^/]*$/, '').replace(/(?:\/backup)+$/i, '')
  return `${dir}::${matchName(entry)}`
}

/** 광역 키: 최상위 작업 폴더 + 파일명. 백업이 date/backup/ 처럼 다른 하위 폴더에 있어도 매칭. */
function topPairKey(entry: AdScriptEntry): string {
  return `${entry.fullPath.split('/')[0] ?? ''}::${matchName(entry)}`
}

function attachBackups(entries: AdScriptEntry[]): void {
  const mainStrict = new Map<string, AdScriptEntry>()
  const mainTop = new Map<string, AdScriptEntry>()
  for (const e of entries) {
    if (isBackupEntry(e)) continue
    const sk = strictPairKey(e)
    if (!mainStrict.has(sk)) mainStrict.set(sk, e)
    const tk = topPairKey(e)
    if (!mainTop.has(tk)) mainTop.set(tk, e)
  }
  for (const e of entries) {
    if (!isBackupEntry(e)) continue
    // 1) 같은 하위 폴더 메인 우선 → 2) 같은 작업 폴더 메인.
    const main = mainStrict.get(strictPairKey(e)) ?? mainTop.get(topPairKey(e))
    if (main && main !== e) {
      main.backups.push(e)
      e.isAttachedBackup = true
    }
  }
}

// 경로의 '폴더'에 이 키워드가 들어가면 대시보드에서 제외(참고용 폴더 등). 파일명은 대상 아님.
const EXCLUDED_FOLDER_KEYWORDS = ['참고']

/** 경로의 디렉터리(파일명 제외) 중 제외 키워드가 든 폴더가 있으면 true. */
function isExcludedByFolder(id: string): boolean {
  const dirs = id
    .replace(/^\.\/ads\//, '')
    .split('/')
    .slice(0, -1)
  return dirs.some((d) => EXCLUDED_FOLDER_KEYWORDS.some((k) => d.includes(k)))
}

/** 스캔된 전체 광고 스크립트 목록(최신 날짜 우선). '참고' 등 제외 폴더는 뺀다. */
export const adScriptCatalog: AdScriptEntry[] = Object.keys(rawLoaders)
  .filter((id) => !isExcludedByFolder(id))
  .map(parseEntry)
  .sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.fullPath < b.fullPath ? -1 : 1
  })

// 백업 파일을 메인에 연결(개별 목록에서는 숨김 → 메인 카드의 아이콘/팝업으로 노출).
attachBackups(adScriptCatalog)

/** 상세보기용 원본 스크립트 텍스트를 lazy 로 불러온다. */
export async function loadScriptSource(id: string): Promise<string> {
  const loader = rawLoaders[id]
  if (!loader) throw new Error(`스크립트를 찾을 수 없습니다: ${id}`)
  return loader()
}

export type GroupKey = 'company' | 'adTag' | 'date'

export interface CatalogGroup {
  key: string
  entries: AdScriptEntry[]
}

// 정렬 시 뒤로 보낼 그룹: '기타'(참고/미리보기) → '미분류' 순으로 맨 뒤.
function trailingRank(key: string): number {
  if (key === '미분류') return 2
  if (key === MISC_GROUP) return 1
  return 0
}

/** 지정한 기준으로 묶고, 항목 수가 많은 그룹부터 정렬한다.('기타'·'미분류'는 맨 뒤) */
export function groupCatalog(entries: AdScriptEntry[], by: GroupKey): CatalogGroup[] {
  const map = new Map<string, AdScriptEntry[]>()
  for (const entry of entries) {
    const key = by === 'company' ? entry.company : by === 'adTag' ? entry.adTag : entry.date || '(날짜 미상)'
    const bucket = map.get(key)
    if (bucket) bucket.push(entry)
    else map.set(key, [entry])
  }
  const groups: CatalogGroup[] = [...map.entries()].map(([key, list]) => ({ key, entries: list }))
  groups.sort((a, b) => {
    const ra = trailingRank(a.key)
    const rb = trailingRank(b.key)
    if (ra !== rb) return ra - rb
    if (by === 'date') return a.key < b.key ? 1 : -1
    if (a.entries.length !== b.entries.length) return b.entries.length - a.entries.length
    return a.key < b.key ? -1 : 1
  })
  return groups
}
