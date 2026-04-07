import type { DomainErrorRateRankRow, DomainInsights, DomainLatencyRankRow, MonitorHistoryEntry, MonitorReport, ScriptIssueTop10Row } from './types'

function mergeDomainInsights(snapshots: DomainInsights[]): DomainInsights | null {
  if (!snapshots.length) return null

  const lat = new Map<string, { sumDur: number; count: number }>()
  for (const ins of snapshots) {
    for (const r of ins.latencyTop5 ?? []) {
      const c = r.sampleCount ?? 0
      const prev = lat.get(r.hostname) ?? { sumDur: 0, count: 0 }
      prev.sumDur += r.avgDurationMs * c
      prev.count += c
      lat.set(r.hostname, prev)
    }
  }

  const latencyTop5: DomainLatencyRankRow[] = [...lat.entries()]
    .map(([hostname, v]) => ({
      hostname,
      avgDurationMs: v.count > 0 ? v.sumDur / v.count : 0,
      sampleCount: v.count,
    }))
    .filter((r) => r.sampleCount >= 2 && r.avgDurationMs > 0)
    .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
    .slice(0, 5)

  const errRes = new Map<string, { errors: number; resources: number }>()
  for (const ins of snapshots) {
    for (const r of ins.errorRateTop5 ?? []) {
      const prev = errRes.get(r.hostname) ?? { errors: 0, resources: 0 }
      prev.errors += r.errorCount
      prev.resources += r.resourceCount
      errRes.set(r.hostname, prev)
    }
  }

  const rateCandidates: DomainErrorRateRankRow[] = []
  for (const [hostname, v] of errRes) {
    if (v.errors < 1) continue
    const resourceCount = v.resources
    const errorRate = resourceCount > 0 ? v.errors / resourceCount : 1
    rateCandidates.push({ hostname, errorCount: v.errors, resourceCount, errorRate })
  }
  rateCandidates.sort((a, b) => b.errorRate - a.errorRate || b.errorCount - a.errorCount)
  const errorRateTop5 = rateCandidates.slice(0, 5)

  if (!latencyTop5.length && !errorRateTop5.length) return null
  return { latencyTop5, errorRateTop5 }
}

function mergeScriptIssueTop10(groups: ScriptIssueTop10Row[][]): ScriptIssueTop10Row[] {
  const map = new Map<string, { errors: number; warnings: number }>()
  for (const rows of groups) {
    for (const r of rows) {
      const cur = map.get(r.sourceUrl) ?? { errors: 0, warnings: 0 }
      cur.errors += r.errors
      cur.warnings += r.warnings
      map.set(r.sourceUrl, cur)
    }
  }
  return [...map.entries()]
    .map(([sourceUrl, v]) => ({
      sourceUrl,
      errors: v.errors,
      warnings: v.warnings,
      total: v.errors + v.warnings,
    }))
    .sort((a, b) => b.total - a.total || b.errors - a.errors)
    .slice(0, 10)
}

/**
 * checkedAt 기준으로 스냅샷을 한 번만 쓰고(동일 시각은 현재 리포트가 있으면 덮어씀),
 * 모든 기록·이번 리포트를 합산한 Top5 / Top10을 만든다.
 */
export function buildAggregatedRankings(
  historyItems: MonitorHistoryEntry[],
  report: MonitorReport | null,
): {
  domainInsights: DomainInsights | null
  scriptIssueTop10: ScriptIssueTop10Row[]
  snapshotCount: number
} {
  const byAt = new Map<string, { domain?: DomainInsights; script?: ScriptIssueTop10Row[] }>()

  for (const it of historyItems) {
    const cur = byAt.get(it.checkedAt) ?? {}
    if (it.domainInsights) cur.domain = it.domainInsights
    if (it.scriptIssueTop10?.length) cur.script = it.scriptIssueTop10
    if (cur.domain != null || (cur.script != null && cur.script.length > 0)) {
      byAt.set(it.checkedAt, cur)
    }
  }

  if (report?.diagnostics) {
    const cur = byAt.get(report.checkedAt) ?? {}
    if (report.diagnostics.domainInsights) cur.domain = report.diagnostics.domainInsights
    if (report.diagnostics.scriptIssueTop10?.length) cur.script = report.diagnostics.scriptIssueTop10
    if (cur.domain != null || (cur.script != null && cur.script.length > 0)) {
      byAt.set(report.checkedAt, cur)
    }
  }

  const domainSnapshots = [...byAt.values()]
    .map((s) => s.domain)
    .filter((d): d is DomainInsights => d != null)
  const scriptGroups = [...byAt.values()]
    .map((s) => s.script)
    .filter((g): g is ScriptIssueTop10Row[] => g != null && g.length > 0)

  return {
    domainInsights: mergeDomainInsights(domainSnapshots),
    scriptIssueTop10: mergeScriptIssueTop10(scriptGroups),
    snapshotCount: byAt.size,
  }
}
