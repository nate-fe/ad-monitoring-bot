/** 페이지 내 측정(랩 환경). Lighthouse TBT와 창·구간 정의가 다를 수 있음 */
/** 호스트(Source URL / 요청 URL의 hostname)별 Performance 리소스 duration 평균 상위 */
export type DomainLatencyRankRow = {
  hostname: string
  /** 해당 호스트 리소스(네비게이션 제외) duration 산술 평균, ms */
  avgDurationMs: number
  sampleCount: number
}

/**
 * 에러율 = 해당 호스트의 에러 건수 ÷ Performance Resource Timing에 잡힌 동일 호스트 서브리소스 건수.
 * resourceCount: `getEntriesByType('resource')`에서 navigation 제외 후 hostname별 개수(모니터 스크립트와 동일).
 * 에러 건수는 페이지 오류·페이지 콘솔 오류·요청 실패만 포함(헤드리스 devtools 네트워크 로그 제외).
 * 리소스가 0이면 분모 없음 → 표시상 에러율은 —, 순위 계산은 별도(스크립트는 1로 둠).
 */
export type DomainErrorRateRankRow = {
  hostname: string
  errorCount: number
  resourceCount: number
  errorRate: number
  /** 해당 호스트로 잡힌 Resource Timing의 고유 요청 URL(알파벳 순, 모니터 리포트에 포함) */
  resourceUrls?: string[]
}

export type DomainInsights = {
  latencyTop5: DomainLatencyRankRow[]
  errorRateTop5: DomainErrorRateRankRow[]
}

/** 페이지 오류·페이지 콘솔의 sourceUrl을 스크립트 경로 단위로 집계한 상위 10개 */
export type ScriptIssueTop10Row = {
  sourceUrl: string
  errors: number
  warnings: number
  total: number
  /** 해당 출처에서 잡힌 고유 오류 메시지(모니터·집계 시 합집합) */
  errorMessages?: string[]
  /** 해당 출처에서 잡힌 고유 경고 메시지 */
  warningMessages?: string[]
}

export type MonitorPerformanceMetrics = {
  /** Long Task(>50ms) 블로킹 구간 합(∑ max(0, duration−50)). ms */
  approxTbtMs: number
  longTaskCount: number
  /**
   * 광고로 추정되는 script 리소스의 Performance `duration` 평균(ms).
   * 네트워크+파싱+실행 구간에 가깝고, 순수 CPU만은 아님.
   */
  avgAdScriptResourceDurationMs: number
  adScriptResourceCount: number
  /** CLS(세션 창 최대값). 2026-10-21 이전 기록에는 없다 */
  cls?: number
  layoutShiftCount?: number
  /** 측정 중 받은 script 요청 수와 전송(압축)·원본 바이트 합 */
  scriptRequestCount?: number
  scriptTransferBytes?: number
  scriptDecodedBytes?: number
  adScriptTransferBytes?: number
}

export type LayoutShiftSource = {
  /** 밀린 요소(tag#id.class) */
  node?: string
  /** 가장 가까운 id 가 있는 조상 */
  anchor?: string
  /** 광고칸 안이거나 iframe 을 품은 요소 */
  adLike: boolean
  fromY: number
  toY: number
  fromHeight: number
  toHeight: number
}

export type LayoutShiftDiagnostics = {
  cls: number
  /** 모든 이동의 합(세션 창으로 자르지 않음) */
  totalShift: number
  /** 광고 관련 요소가 낀 이동의 합 */
  adLikeShift: number
  shiftCount: number
  worstWindowMs: { start: number; end: number }
  topShifts: { value: number; atMs: number; inWorstWindow: boolean; adLike: boolean; sources: LayoutShiftSource[] }[]
}

/** first: 자사(nate) · ad: 광고(주소 패턴 또는 광고 iframe 안) · other: 그 밖의 외부 */
export type ScriptKind = 'first' | 'ad' | 'other'

type ByteTotals = { requests: number; transferBytes: number; decodedBytes: number }

export type ScriptSizeDiagnostics = ByteTotals & {
  uniqueUrls: number
  hostCount: number
  /** 이미 받은 파일을 캐시에서 다시 꺼낸 횟수(전송 0, 원본 크기는 셈) */
  cachedRequests: number
  byKind: Record<ScriptKind, ByteTotals>
  topHosts: (ByteTotals & { host: string; kind: ScriptKind })[]
  largest: (ByteTotals & {
    url: string
    host: string
    kind: ScriptKind
    inIframe: boolean
    /** 메인 문서 바로 아래 iframe 주소 */
    frameUrl?: string
    cachedRequests: number
    status?: number
  })[]
}

export type PagePerformanceDiagnostics = {
  layoutShift?: LayoutShiftDiagnostics
  scripts?: ScriptSizeDiagnostics
}

/** 콘솔/페이지 오류의 sourceUrl+line 기준으로 측정 시 캐시한 스크립트 본문에서 자른 코드 */
export type SourceSnippet = {
  text: string
  focusLine?: number
  startLine?: number
  endLine?: number
  truncated?: boolean
}

/**
 * 리포트를 만든 그 실행에서 찍은 페이지 전체(맨 위~맨 아래) 캡쳐.
 * 한 장에 담기지 않는 긴 지면은 위에서부터 여러 장으로 잘라 files 에 순서대로 담는다.
 * files 는 사이트 루트 기준 경로(BASE_URL 뒤에 붙여 사용). 보존 기간이 지나면 이미지가 삭제되어 링크가 끊긴다.
 */
export type MonitorScreenshot = {
  capturedAt: string
  files: string[]
  /** CSS 픽셀 기준 페이지 폭 */
  width: number
  /** 캡쳐 시점 문서 전체 높이(CSS 픽셀) */
  totalHeight: number
  viewport?: { width: number; height: number }
  /** 측정에 쓴 뷰포트 종류 */
  emulation?: string
  /** 지면이 너무 길어 아래쪽 일부가 빠진 경우 */
  truncated?: boolean
}

export type AdSlotRect = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 캡쳐 직전·직후 두 번 잰 광고 슬롯 하나(한 번이라도 그려졌으면 그려진 쪽을 남긴다).
 * 광고태그는 스크립트 URL 마지막 조각에서 얻는다.
 *
 * `measurable: false` 는 「미노출」이 아니라 **잴 수 없었다**는 뜻이다. 앵커처럼 스크립트가
 * head 에 있어 컨테이너를 못 찾은 경우라, 정상 노출 중일 수 있다. 둘을 섞으면 안 된다.
 */
/**
 * 광고칸을 찾아낸 방식.
 * cyad 만 `지면@슬롯` 형태의 광고태그를 가지며, 나머지는 위젯 id 등으로 식별한다.
 */
export type AdSlotSource = 'cyad' | 'gpt' | 'dable' | 'coupang'

export type AdSlotVisibility =
  | {
      adTag: string
      source: AdSlotSource
      measurable: false
      reason: 'no-container' | 'container-is-section'
    }
  | {
      adTag: string
      source: AdSlotSource
      /** 다른 광고사 칸을 띄운 네이트 광고태그(`지면@슬롯`). 못 찾았거나 cyad 칸이면 없음 */
      parentAdTag?: string
      measurable: true
      /** 컨테이너 높이가 있고 소재가 1개 이상, 또는 같은 자리를 다른 광고사가 채움(filledBy) */
      rendered: boolean
      /** 높이 10px 미만 — 광고가 없어 영역이 닫힘(미노출로 보지 않음). 2026-10-26 이전 리포트에는 없다 */
      collapsed?: boolean
      /** 이 칸은 비었지만 패스백으로 같은 자리를 채운 광고칸의 태그 */
      filledBy?: string
      rect: AdSlotRect
      mediaCount: number
      content?: {
        tag: string
        rect: AdSlotRect
        /** 컨테이너 안에서 좌우 어긋남(0이면 중앙) */
        centerOffset: number
      }
      /** 부모 안에서 컨테이너 좌우 어긋남(0이면 중앙) */
      boxCenterOffset: number
    }

export type MonitorReport = {
  ok: boolean
  url: string
  status: number
  durationMs: number
  checkedAt: string
  failures: string[]
  screenshot?: MonitorScreenshot
  diagnostics?: {
    pageErrors?: {
      message: string
      stack?: string
      sourceUrl?: string
      line?: number
      column?: number
      sourceSnippet?: SourceSnippet
    }[]
    consoleMessages?: {
      type: string
      text: string
      url?: string
      sourceUrl?: string
      line?: number
      column?: number
      source?: string
      /** 수집 단계에서 합쳐진 동일 메시지 개수(dedup). 없으면 1로 취급. */
      dupeCount?: number
      /** sourceUrl+line 에 해당하는 스크립트/문서 코드 스니펫(측정 시 응답 본문에서 추출) */
      sourceSnippet?: SourceSnippet
    }[]
    requestFailures?: { url: string; method: string; resourceType: string; errorText: string }[]
    performanceMetrics?: MonitorPerformanceMetrics
    domainInsights?: DomainInsights
    scriptIssueTop10?: ScriptIssueTop10Row[]
    /** 캡쳐 직전 광고 슬롯별 노출 여부 */
    adSlots?: AdSlotVisibility[]
    /** 강제 리다이렉트·뒤로가기 가로채기 탐지 */
    hijack?: HijackDiagnostics
    /** CLS·스크립트 용량 */
    pagePerformance?: PagePerformanceDiagnostics
  }
}

/** 스크립트 호출 위치(스택의 첫 http 프레임) */
type CallSite = { sourceUrl?: string; line?: number; column?: number }

/** 측정 중 사용자 조작 없이 일어난 메인 프레임 이동(막음) 또는 새 창 */
export type HijackRedirect = CallSite & {
  kind: 'navigation' | 'popup'
  url: string
  at: string
  /** CDP frameRequestedNavigation 의 reason(scriptInitiated·metaTagRefresh 등) */
  reason?: string
  blocked: boolean
  count: number
  /** 같은 주소로 다시 열기(지면 자체 새로고침) — 강제 이동으로 세지 않는다 */
  selfReload?: boolean
}

type HookRecord = CallSite & {
  atMs: number
  pageUrl: string
  userActivated?: boolean
  frame: 'main' | 'iframe'
}

export type HijackDiagnostics = {
  forcedRedirectCount: number
  redirects: HijackRedirect[]
  backHijack: {
    suspected: boolean
    reasons: string[]
    backTest?: {
      historyLength: number
      wentBack: boolean
      urlBefore?: string
      urlAfter?: string
      stayedOnPage: boolean
      triggeredRedirect: boolean
    }
    historyCalls: (HookRecord & { method: 'pushState' | 'replaceState'; url: string; sameDocumentUrl: boolean })[]
    listeners: (HookRecord & { type: string; via: string })[]
    hashChanges: { atMs: number; from: string; to: string; userActivated?: boolean; frame: 'main' | 'iframe' }[]
  }
  windowOpens: (HookRecord & { url: string })[]
}

export type MonitorHistoryEntry = {
  checkedAt: string
  ok: boolean
  url: string
  status: number
  durationMs: number
  failures: string[]
  counts: {
    pageErrors: number
    consoleErrors: number
    consoleWarnings: number
    consoleLogs?: number
    requestFailures: number
  }
  pageErrorSample?: {
    message: string
    sourceUrl?: string
    line?: number
    column?: number
    sourceSnippet?: SourceSnippet
  }[]
  consoleErrorSample?: {
    type: string
    text: string
    url?: string
    sourceUrl?: string
    line?: number
    column?: number
    sourceSnippet?: SourceSnippet
  }[]
  consoleWarningSample?: {
    type: string
    text: string
    url?: string
    sourceUrl?: string
    line?: number
    column?: number
    sourceSnippet?: SourceSnippet
  }[]
  consoleLogSample?: {
    type: string
    text: string
    url?: string
    sourceUrl?: string
    line?: number
    column?: number
    sourceSnippet?: SourceSnippet
  }[]
  devToolsConsoleSample?: {
    type: string
    text: string
    url?: string
    sourceUrl?: string
    line?: number
    column?: number
    source?: string
  }[]
  requestFailureSample?: { url: string; method: string; resourceType: string; errorText: string }[]
  meta?: {
    runId?: string
    runUrl?: string
    sha?: string
  }
  /** 해당 시각 화면 전체 캡쳐(보존 기간이 지난 실행은 없음) */
  screenshot?: MonitorScreenshot
  performanceMetrics?: MonitorPerformanceMetrics
  /** 해당 시점 monitor-report의 도메인 Top5 스냅샷(히스토리 합산용) */
  domainInsights?: DomainInsights
  /** 해당 시점 스크립트 Top10 스냅샷(히스토리 합산용) */
  scriptIssueTop10?: ScriptIssueTop10Row[]
  /** 광고칸 노출 여부 요약(팀룸 알림의 연속 미노출 판정용). 2026-10 이전 실행에는 없음 */
  adSlots?: MonitorHistoryAdSlot[]
}

export type MonitorHistoryAdSlot = { adTag: string; parentAdTag?: string } & (
  | { measurable: false }
  /** collapsed: 안 나온 칸이 닫혔는지. 2026-10-26 이전 기록에는 없다 */
  | { measurable: true; rendered: boolean; collapsed?: boolean }
)

