import type {
  LayoutShiftSource,
  MonitorPerformanceMetrics,
  PagePerformanceDiagnostics,
  ScriptKind,
} from '../monitor/types'
import { InlineHelpTooltip } from './InlineHelpTooltip'

type Tone = 'ok' | 'warn' | 'fail'
const TONE_LABEL: Record<Tone, string> = { ok: '정상', warn: '경고', fail: '위험' }

/** 정상 상한(이하면 정상)과 위험 하한(초과면 위험). 그 사이는 경고 */
type Threshold = { okMax: number; failMin: number; scaleMax: number }

/** Core Web Vitals 기준 */
const CLS_THRESHOLD: Threshold = { okMax: 0.1, failMin: 0.25, scaleMax: 0.5 }
/** Lighthouse 모바일 TBT 기준(ms) — 기록 차트의 참고선과 같다 */
const TBT_THRESHOLD: Threshold = { okMax: 200, failMin: 600, scaleMax: 1000 }
/** 광고 스크립트 평균 시간(ms). 공식 기준이 없어 기록(평소 0.1~0.4초)을 보고 정한 팀 기준 */
const AD_SCRIPT_THRESHOLD: Threshold = { okMax: 500, failMin: 1000, scaleMax: 2000 }

function toneOf(value: number, t: Threshold): Tone {
  if (value <= t.okMax) return 'ok'
  if (value <= t.failMin) return 'warn'
  return 'fail'
}

const MAIN_THREAD_HELP_TEXT = [
  '광고·지면 스크립트가 휴대폰의 처리 능력을 얼마나 붙잡고 있었는지 봅니다.',
  '',
  'TBT(근사) — 50ms가 넘게 걸린 작업(Long Task)마다 50ms를 넘긴 만큼을 더한 값입니다. 이 시간 동안은 화면을 눌러도 반응이 늦습니다.',
  '· 0.2초 이하 정상 · 0.6초 이하 경고 · 그 위는 위험 (구글 Lighthouse 모바일 기준)',
  '· 측정 방식이 Lighthouse와 조금 달라서 근삿값입니다.',
  '',
  '광고 스크립트 평균 시간 — 광고 서버 주소로 보이는 스크립트 파일을 요청해서 다 받기까지 걸린 시간의 평균입니다. 네트워크 시간이 대부분입니다.',
  '· 0.5초 이하 정상 · 1초 이하 경고 · 그 위는 위험',
  '· 공식 기준이 없어 이 지면의 평소 값(0.1~0.4초)을 보고 정한 팀 기준입니다.',
].join('\n')

const CLS_HELP_TEXT = [
  'CLS(Cumulative Layout Shift)는 읽던 내용이 갑자기 밀린 정도입니다. 광고가 늦게 뜨면서 칸 높이가 0에서 늘어나면 아래 기사 본문이 밀려 값이 커집니다.',
  '',
  '· 0.1 이하 정상 · 0.25 이하 경고 · 그 위는 위험 (구글 Core Web Vitals 기준)',
  '· 1초 안에 이어진 이동을 한 묶음으로 보고, 가장 큰 묶음의 합이 CLS입니다.',
  '· 지면을 끝까지 내려 보는 동안 생긴 이동까지 셉니다. 캡쳐 직전에 잽니다.',
  '',
  '「광고 관련」은 밀린 요소가 광고칸(id·class에 ad·banner 등) 안이거나 iframe을 품고 있는 경우입니다. 해결은 대개 광고칸에 미리 높이(min-height)를 잡아 두는 것입니다.',
].join('\n')

const SCRIPT_HELP_TEXT = [
  '측정하는 동안 지면과 광고 iframe이 받은 모든 스크립트 파일의 크기입니다.',
  '',
  '· 전송 — 네트워크로 받은 크기(gzip 등 압축 후). 데이터 사용량·로딩 시간에 영향',
  '· 원본 — 압축을 푼 크기. 브라우저가 읽고 실행해야 하는 양이라 메인 스레드 부담에 영향',
  '',
  '· 자사 — nate.com, nateimg.co.kr',
  '· 광고 — 광고 서버 주소(cyad, 구글, 데이블, 모비위드 등)이거나 광고 iframe 안에서 받은 것',
  '· 기타 외부 — 통계·위젯 등 그 밖의 외부 도메인',
  '',
  '· N번 호출 — 같은 파일을 여러 곳(대개 광고 iframe마다)에서 N번 불러옴. 불러올 때마다 다시 읽고 실행하므로 원본 크기에는 호출한 횟수만큼 들어갑니다.',
].join('\n')

const KIND_LABEL: Record<ScriptKind, string> = { first: '자사', ad: '광고', other: '기타 외부' }
const KIND_ORDER: ScriptKind[] = ['ad', 'first', 'other']

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb < 100 ? kb.toFixed(1) : Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2).replace(/\.?0+$/, '')}초` : `${Math.round(ms)}ms`
}

function formatCls(cls: number): string {
  return cls > 0 && cls < 0.001 ? '0.001 미만' : cls.toFixed(3)
}

function GradePill({ tone }: { tone: Tone }) {
  return <span className={`perfGrade perfTone--${tone}`}>{TONE_LABEL[tone]}</span>
}

function describeMove(src: LayoutShiftSource): string {
  const dy = src.toY - src.fromY
  const dh = src.toHeight - src.fromHeight
  const parts: string[] = []
  if (dy) parts.push(`${dy > 0 ? '아래로' : '위로'} ${Math.abs(dy)}px`)
  if (dh) parts.push(`높이 ${src.fromHeight}→${src.toHeight}px`)
  return parts.join(' · ') || '위치 변화'
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    const file = u.pathname.split('/').filter(Boolean).pop() ?? ''
    return `${u.hostname}/…/${file || ''}${u.search ? '?…' : ''}`
  } catch {
    return url
  }
}

function LayoutShiftBlock({ data }: { data: NonNullable<PagePerformanceDiagnostics['layoutShift']> }) {
  const tone = toneOf(data.cls, CLS_THRESHOLD)
  const adPct = data.totalShift > 0 ? Math.round((data.adLikeShift / data.totalShift) * 100) : 0
  const list = (
    <ul className="perfShiftList">
      {data.topShifts.map((shift, i) => {
        const src = shift.sources[0]
        return (
          <li key={`${shift.atMs}-${i}`} className={shift.inWorstWindow ? 'isWorst' : undefined}>
            <span className="perfShiftValue">{shift.value.toFixed(3)}</span>
            <span className="muted perfShiftTime">{(shift.atMs / 1000).toFixed(1)}초</span>
            {shift.adLike ? <span className="pill warning">광고 관련</span> : null}
            {src ? (
              <>
                <code className="adSlotTag">
                  {src.anchor && !src.node?.includes(src.anchor) ? `${src.anchor} › ` : ''}
                  {src.node ?? '(사라진 요소)'}
                </code>
                <span className="muted perfShiftMove">{describeMove(src)}</span>
              </>
            ) : (
              <span className="muted">요소 정보 없음</span>
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="perfBlock">
      <div className="perfBlockHead">
        <span className="perfBlockTitle">레이아웃 밀림 (CLS)</span>
        <InlineHelpTooltip text={CLS_HELP_TEXT} />
      </div>
      <div className="perfStatRow">
        <span className={`perfBigValue perfTone--${tone}`}>{formatCls(data.cls)}</span>
        <GradePill tone={tone} />
        <span className="muted">
          이동 {data.shiftCount}회
          {data.shiftCount ? ` · 광고 관련 ${adPct}%` : ''}
        </span>
      </div>
      <GradeScale value={data.cls} threshold={CLS_THRESHOLD} format={(v) => String(v)} />
      {data.topShifts.length ? (
        tone === 'ok' ? (
          <details className="adSlotDetails">
            <summary>큰 이동 {data.topShifts.length}건 보기</summary>
            {list}
          </details>
        ) : (
          <>
            <div className="perfSubTitle">가장 크게 밀린 순간 (테두리 = CLS 값에 들어간 이동)</div>
            {list}
          </>
        )
      ) : (
        <p className="muted">이번 실행에서 레이아웃이 밀린 적이 없습니다.</p>
      )}
    </div>
  )
}

/** 0 ~ scaleMax 눈금 위에 정상·경고·위험 구간과 이번 값 위치 */
function GradeScale({
  value,
  threshold,
  format,
}: {
  value: number
  threshold: Threshold
  format: (v: number) => string
}) {
  const pct = (v: number) => `${(Math.min(Math.max(v, 0), threshold.scaleMax) / threshold.scaleMax) * 100}%`
  return (
    <div className="perfClsScale" aria-hidden="true">
      <div className="perfClsBand perfTone--ok" style={{ width: pct(threshold.okMax) }} />
      <div
        className="perfClsBand perfTone--warn"
        style={{ width: `calc(${pct(threshold.failMin)} - ${pct(threshold.okMax)})` }}
      />
      <div className="perfClsBand perfTone--fail" style={{ flex: 1 }} />
      <div className="perfClsMarker" style={{ left: pct(value) }} />
      <span className="perfClsTick" style={{ left: pct(threshold.okMax) }}>
        {format(threshold.okMax)}
      </span>
      <span className="perfClsTick" style={{ left: pct(threshold.failMin) }}>
        {format(threshold.failMin)}
      </span>
    </div>
  )
}

function MainThreadBlock({ metrics }: { metrics: MonitorPerformanceMetrics }) {
  const tbtTone = toneOf(metrics.approxTbtMs, TBT_THRESHOLD)
  const hasAdScripts = metrics.adScriptResourceCount > 0
  const adTone = toneOf(metrics.avgAdScriptResourceDurationMs, AD_SCRIPT_THRESHOLD)
  return (
    <div className="perfBlock">
      <div className="perfBlockHead">
        <span className="perfBlockTitle">메인 스레드 · 광고 스크립트 시간</span>
        <InlineHelpTooltip text={MAIN_THREAD_HELP_TEXT} />
      </div>
      <div className="perfMetricGrid">
        <div className="perfMetric">
          <div className="perfMetricLabel">TBT(근사)</div>
          <div className="perfStatRow">
            <span className={`perfBigValue perfTone--${tbtTone}`}>{formatMs(metrics.approxTbtMs)}</span>
            <GradePill tone={tbtTone} />
            <span className="muted">Long Task {metrics.longTaskCount}건</span>
          </div>
          <GradeScale value={metrics.approxTbtMs} threshold={TBT_THRESHOLD} format={formatMs} />
        </div>
        <div className="perfMetric">
          <div className="perfMetricLabel">광고 스크립트 평균 시간</div>
          {hasAdScripts ? (
            <>
              <div className="perfStatRow">
                <span className={`perfBigValue perfTone--${adTone}`}>
                  {formatMs(metrics.avgAdScriptResourceDurationMs)}
                </span>
                <GradePill tone={adTone} />
                <span className="muted">스크립트 {metrics.adScriptResourceCount}개 기준</span>
              </div>
              <GradeScale
                value={metrics.avgAdScriptResourceDurationMs}
                threshold={AD_SCRIPT_THRESHOLD}
                format={formatMs}
              />
            </>
          ) : (
            <p className="muted">광고 서버 주소로 보이는 스크립트가 없어 재지 않았습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/** 섹션 맨 위 한 줄 — 지표마다 정상·경고·위험을 한눈에 */
function GradeSummary({ items }: { items: { label: string; tone: Tone }[] }) {
  if (!items.length) return null
  const worst: Tone = items.some((i) => i.tone === 'fail') ? 'fail' : items.some((i) => i.tone === 'warn') ? 'warn' : 'ok'
  return (
    <div className={`perfSummary perfTone--${worst}`}>
      {items.map((item) => (
        <span key={item.label} className="perfSummaryItem">
          {item.label} <GradePill tone={item.tone} />
        </span>
      ))}
    </div>
  )
}

function ScriptSizeBlock({ data }: { data: NonNullable<PagePerformanceDiagnostics['scripts']> }) {
  const total = data.transferBytes || 1
  const hostMax = Math.max(1, ...data.topHosts.map((h) => h.transferBytes))
  return (
    <div className="perfBlock">
      <div className="perfBlockHead">
        <span className="perfBlockTitle">스크립트 용량</span>
        <InlineHelpTooltip text={SCRIPT_HELP_TEXT} />
      </div>
      <div className="perfStatRow">
        <span className="perfBigValue">{formatBytes(data.transferBytes)}</span>
        <span className="muted">
          전송 · 원본 {formatBytes(data.decodedBytes)} · 파일 {data.requests}개 · 도메인 {data.hostCount}곳
        </span>
      </div>

      <div className="perfKindBar" role="img" aria-label="스크립트 전송 크기 구성">
        {KIND_ORDER.map((kind) =>
          data.byKind[kind].transferBytes > 0 ? (
            <span
              key={kind}
              className={`perfKindSeg perfKind--${kind}`}
              style={{ width: `${(data.byKind[kind].transferBytes / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <div className="perfKindLegend">
        {KIND_ORDER.map((kind) => (
          <span key={kind} className="perfKindLegendItem">
            <span className={`perfKindSwatch perfKind--${kind}`} />
            {KIND_LABEL[kind]} <b>{formatBytes(data.byKind[kind].transferBytes)}</b>
            <span className="muted">
              {' '}
              {Math.round((data.byKind[kind].transferBytes / total) * 100)}% · {data.byKind[kind].requests}개
            </span>
          </span>
        ))}
      </div>

      <div className="perfSubTitle">도메인별 (전송 크기 순)</div>
      <ul className="perfHostList">
        {data.topHosts.map((h) => (
          <li key={h.host}>
            <span className="perfHostName" title={h.host}>
              {h.host}
            </span>
            <span className="perfHostBarTrack">
              <span
                className={`perfHostBar perfKind--${h.kind}`}
                style={{ width: `${(h.transferBytes / hostMax) * 100}%` }}
              />
            </span>
            <span className="perfHostBytes">{formatBytes(h.transferBytes)}</span>
            <span className="muted perfHostCount">{h.requests}개</span>
          </li>
        ))}
      </ul>

      {data.largest.length ? (
        <details className="adSlotDetails">
          <summary>큰 스크립트 {data.largest.length}개 보기</summary>
          <ul className="perfScriptList">
            {data.largest.map((s) => (
              <li key={s.url}>
                <span className={`perfKindTag perfKind--${s.kind}`}>{KIND_LABEL[s.kind]}</span>
                <a className="perfScriptUrl" href={s.url} target="_blank" rel="noreferrer" title={s.url}>
                  {shortUrl(s.url)}
                </a>
                <span className="perfScriptBytes">
                  {formatBytes(s.transferBytes)}
                  <span className="muted"> / 원본 {formatBytes(s.decodedBytes)}</span>
                </span>
                {s.requests > 1 ? (
                  <span className="pill info">
                    {s.requests}번 호출
                  </span>
                ) : null}
                {s.status ? <span className="pill error">HTTP {s.status}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

export function PagePerformanceSection({
  data,
  metrics,
}: {
  data?: PagePerformanceDiagnostics | null
  metrics?: MonitorPerformanceMetrics | null
}) {
  const summary: { label: string; tone: Tone }[] = []
  if (metrics) {
    summary.push({ label: 'TBT', tone: toneOf(metrics.approxTbtMs, TBT_THRESHOLD) })
    if (metrics.adScriptResourceCount > 0) {
      summary.push({
        label: '광고 스크립트 시간',
        tone: toneOf(metrics.avgAdScriptResourceDurationMs, AD_SCRIPT_THRESHOLD),
      })
    }
  }
  if (data?.layoutShift) summary.push({ label: 'CLS', tone: toneOf(data.layoutShift.cls, CLS_THRESHOLD) })

  return (
    <div className="diagSection perfSection">
      <div className="diagSectionTitle">페이지 성능 (이번 실행)</div>
      <div className="perfBlocks">
        {metrics ? <MainThreadBlock metrics={metrics} /> : null}
        {data?.layoutShift ? <LayoutShiftBlock data={data.layoutShift} /> : null}
        {data?.scripts ? <ScriptSizeBlock data={data.scripts} /> : null}
      </div>
    </div>
  )
}
