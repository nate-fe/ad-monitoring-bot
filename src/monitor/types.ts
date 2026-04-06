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
}

