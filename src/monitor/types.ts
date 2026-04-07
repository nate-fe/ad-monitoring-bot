/** 페이지 내 측정(랩 환경). Lighthouse TBT와 창·구간 정의가 다를 수 있음 */
/** 호스트(Source URL / 요청 URL의 hostname)별 Performance 리소스 duration 평균 상위 */
export type DomainLatencyRankRow = {
  hostname: string
  /** 해당 호스트 리소스(네비게이션 제외) duration 산술 평균, ms */
  avgDurationMs: number
  sampleCount: number
}

/**
 * 에러율 = 해당 호스트의 에러 건수 ÷ Performance에 잡힌 동일 호스트 리소스 건수.
 * 에러 건수는 페이지 오류·페이지 콘솔 오류·요청 실패만 포함(헤드리스 devtools 네트워크 로그 제외).
 * 리소스가 0이면 1로 두고 순위만 사용(에러는 있음).
 */
export type DomainErrorRateRankRow = {
  hostname: string
  errorCount: number
  resourceCount: number
  errorRate: number
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

export type MonitorReport = {
  ok: boolean
  url: string
  status: number
  durationMs: number
  checkedAt: string
  failures: string[]
  diagnostics?: {
    pageErrors?: { message: string; stack?: string; sourceUrl?: string; line?: number; column?: number }[]
    consoleMessages?: {
      type: string
      text: string
      url?: string
      sourceUrl?: string
      line?: number
      column?: number
      source?: string
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
  pageErrorSample?: { message: string; sourceUrl?: string; line?: number; column?: number }[]
  consoleErrorSample?: { type: string; text: string; url?: string; sourceUrl?: string; line?: number; column?: number }[]
  consoleWarningSample?: { type: string; text: string; url?: string; sourceUrl?: string; line?: number; column?: number }[]
  consoleLogSample?: { type: string; text: string; url?: string; sourceUrl?: string; line?: number; column?: number }[]
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
  performanceMetrics?: MonitorPerformanceMetrics
  /** 해당 시점 monitor-report의 도메인 Top5 스냅샷(히스토리 합산용) */
  domainInsights?: DomainInsights
  /** 해당 시점 스크립트 Top10 스냅샷(히스토리 합산용) */
  scriptIssueTop10?: ScriptIssueTop10Row[]
}

