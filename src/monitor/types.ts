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
  }
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
}

