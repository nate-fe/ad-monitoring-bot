/**
 * 새로 생긴 문제만 네이트온 팀룸(Incoming Webhook)으로 보낸다.
 *
 * - 보내는 건 한국시간 오전 9시·오후 3시대의 첫 실행뿐이다. 그때 지난번 보낸 실행 이후의 실행을
 *   한 묶음으로 판정하므로, 사이 시간에 생긴 문제도 빠지지 않고 다음 보낼 때 실린다.
 *   그 시간대 실행이 하나도 없으면(스케줄이 밀리거나 빠짐) 그 회차는 건너뛰고 다음 회차에 모아 보낸다.
 * - 판정은 src/monitor/alertDetection.ts 에 있다(생애주기 화면과 같은 「같은 오류」 키를 쓰려고
 *   TS 모듈을 esbuild 로 그 자리에서 번들해 불러온다).
 * - history:update:all 이후에 돌아야 한다. 이번 실행이 히스토리 마지막 항목이어야 하기 때문이다.
 * - NATEON_TEAMROOM_WEBHOOK_URL 이 없거나 --dry-run 이면 보내지 않고 메시지만 출력한다.
 * - 알림이 실패해도 모니터링 결과 배포는 막지 않는다(워크플로에서 continue-on-error).
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { build } from 'esbuild'

const TARGETS = [
  { id: 'news', label: '모바일 뉴스 뷰', historyPath: 'news/view/history.json' },
  { id: 'news-home', label: '모바일 뉴스 홈', historyPath: 'news/home/history.json' },
  { id: 'pann', label: '모바일 판 뷰', historyPath: 'pann/view/history.json' },
  { id: 'pann-home', label: '모바일 판 홈', historyPath: 'pann/home/history.json' },
  { id: 'news-pc', label: 'PC 뉴스 기사뷰', historyPath: 'news/pc/view/history.json' },
  { id: 'news-pc-home', label: 'PC 뉴스 홈', historyPath: 'news/pc/home/history.json' },
  { id: 'pann-pc', label: 'PC 판 뷰', historyPath: 'pann/pc/view/history.json' },
  { id: 'pann-pc-home', label: 'PC 판 홈', historyPath: 'pann/pc/home/history.json' },
]

/** 이 시(한국시간)대의 첫 실행에서만 보낸다 */
const SEND_HOURS_KST = [9, 15]
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
/** 한 실행 안에서 지면별 기록 시각이 벌어질 수 있는 최대 폭(워크플로 timeout-minutes) */
const RUN_SPREAD_MS = 15 * 60 * 1000
/** 지난번 보낸 실행을 이만큼 거슬러 찾는다 */
const SEND_LOOKBACK_MS = 14 * 24 * HOUR_MS

const LEVEL_LABEL = { action: '조치 필요', watch: '확인만' }
/** 한 지면에서 새 오류가 이보다 많으면 나머지는 개수만 적는다(문구 서명이 흔들릴 때 방이 도배되지 않도록) */
const MAX_ISSUES_PER_TARGET = 5
const SEND_TIMEOUT_MS = 10_000

function getEnv(name) {
  const v = process.env[name]
  return v == null ? '' : String(v).trim()
}

async function loadDetector() {
  const result = await build({
    entryPoints: [path.resolve('src', 'monitor', 'alertDetection.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  })
  const code = result.outputFiles[0].text
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}

async function readHistory(relativePath) {
  try {
    const data = JSON.parse(await readFile(path.join(getEnv('NOTIFY_PUBLIC_DIR') || 'public', relativePath), 'utf8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function resolveDashboardBase() {
  const explicit = getEnv('DASHBOARD_BASE_URL')
  if (explicit) return explicit.replace(/\/+$/, '')
  const owner = getEnv('GITHUB_REPOSITORY_OWNER')
  const repo = getEnv('GITHUB_REPOSITORY').split('/')[1]
  if (owner && repo) return `https://${owner}.github.io/${repo}`
  return 'https://yoonzeen.github.io/ad-monitoring-bot'
}

/** ms 가 보내는 시간대 안이면 그 시간대 시작(ms), 아니면 null */
function sendWindowStart(ms) {
  const kst = new Date(ms + KST_OFFSET_MS)
  if (!SEND_HOURS_KST.includes(kst.getUTCHours())) return null
  kst.setUTCMinutes(0, 0, 0)
  return kst.getTime() - KST_OFFSET_MS
}

/** before 보다 이른 보내는 시간대 시작들(가까운 것부터) */
function* earlierSendWindows(before) {
  const day = new Date(before + KST_OFFSET_MS)
  day.setUTCHours(0, 0, 0, 0)
  for (let dayStart = day.getTime() - KST_OFFSET_MS; dayStart > before - SEND_LOOKBACK_MS; dayStart -= 24 * HOUR_MS) {
    for (const hour of [...SEND_HOURS_KST].reverse()) {
      const start = dayStart + hour * HOUR_MS
      if (start < before) yield start
    }
  }
}

function checkedTimes(history) {
  return history.map((it) => Date.parse(it?.checkedAt ?? '')).filter(Number.isFinite).sort((a, b) => a - b)
}

/**
 * 이번 실행이 보낼 차례인지, 보낸다면 어느 시각 이후 기록을 묶을지 정한다.
 * 상태 파일 없이 히스토리만 본다: 「보내는 시간대의 첫 실행」이었던 실행이 곧 지난번 보낸 실행이다.
 */
function planSend(timesByTarget, { ignoreSchedule }) {
  const latests = timesByTarget.map((t) => t[t.length - 1]).filter(Number.isFinite)
  if (!latests.length) return { send: false, reason: '히스토리 없음' }
  // 이번 실행에 기록이 안 남은 지면(대상 URL 없음 등)은 빼고, 이번 실행이 시작된 시각을 잡는다
  const newest = Math.max(...latests)
  const runStart = Math.min(...latests.filter((t) => newest - t <= RUN_SPREAD_MS))
  const previous = timesByTarget.flat().filter((t) => t < runStart)

  const windowStart = sendWindowStart(runStart)
  if (!ignoreSchedule) {
    if (windowStart == null) return { send: false, reason: `보내는 시각 아님(한국시간 ${SEND_HOURS_KST.join('·')}시대만)` }
    if (previous.some((t) => t >= windowStart)) return { send: false, reason: '이 시간대에 이미 보낸 실행이 있음' }
  }

  for (const start of earlierSendWindows(windowStart ?? runStart)) {
    const sentRun = previous.filter((t) => t >= start && t < start + HOUR_MS)
    if (!sentRun.length) continue
    const sentRunStart = Math.min(...sentRun)
    const sentRunEnd = Math.max(...previous.filter((t) => t >= sentRunStart && t <= sentRunStart + RUN_SPREAD_MS))
    return { send: true, since: new Date(sentRunEnd).toISOString() }
  }
  // 거슬러 찾을 기록이 없으면 바로 전 회차 시각부터 묶는다
  const fallback = earlierSendWindows(windowStart ?? runStart).next().value
  return { send: true, since: new Date(fallback).toISOString() }
}

function formatKst(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** 미노출 시각을 이보다 많이 나열하면 처음 ~ 마지막과 횟수로 줄인다 */
const MAX_MISSED_TIMES = 6

/** 「10. 18. 21:55, 23:55, 10. 19. 01:55」 — 날짜가 바뀔 때만 날짜를 붙인다 */
function formatMissedTimes(isoList) {
  if (isoList.length > MAX_MISSED_TIMES) {
    return `${formatKst(isoList[0])} ~ ${formatKst(isoList[isoList.length - 1])} (${isoList.length}회)`
  }
  let prevDay = ''
  return isoList
    .map((iso) => {
      const full = formatKst(iso)
      const [, day, time] = full.match(/^(.*?)\s*(\d{2}:\d{2})$/) ?? [full, '', full]
      const out = day === prevDay ? time : full
      prevDay = day
      return out
    })
    .join(', ')
}

function formatSlotLine(slot) {
  const parent = slot.parentAdTag ? ` (${slot.parentAdTag})` : ''
  const missed = slot.missedAt?.length ? ` — 미노출 ${formatMissedTimes(slot.missedAt)}` : ''
  return `· ${slot.adTag}${parent}${missed}`
}

function shorten(text, max = 120) {
  const t = String(text).replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

function buildMessage(sections, { base, slotStreak, firstCheckedAt, latestCheckedAt }) {
  const range =
    firstCheckedAt === latestCheckedAt
      ? formatKst(latestCheckedAt)
      : `${formatKst(firstCheckedAt)} ~ ${formatKst(latestCheckedAt)}`
  const lines = [`[광고 모니터링] ${range} 검사 결과`]

  for (const { target, alerts } of sections) {
    lines.push('', `■ ${target.label}`)

    const shown = alerts.newIssues.slice(0, MAX_ISSUES_PER_TARGET)
    if (shown.length) {
      lines.push(`새로 잡힌 오류 ${alerts.newIssues.length}건`)
      for (const issue of shown) {
        const level = issue.explainLevel ? `[${LEVEL_LABEL[issue.explainLevel]}] ` : ''
        // 사전에 없는 메시지는 label 이 원문 앞부분이라 원문을 한 번 더 적지 않는다
        const detail = issue.explainLevel ? ` — ${shorten(issue.sampleText, 80)}` : ''
        lines.push(`· ${level}${shorten(issue.label, 80)}${detail}`)
      }
      const rest = alerts.newIssues.length - shown.length
      if (rest > 0) lines.push(`· 외 ${rest}건`)
      lines.push(`→ ${base}/#${target.id}/lifecycle`)
    }

    const slotGroups = [
      ['down', `광고칸 ${slotStreak}회 연속 미노출`],
      ['recovered', '광고칸 다시 노출'],
      ['bounced', `광고칸 ${slotStreak}회 연속 미노출됐다가 다시 노출`],
    ]
    for (const [kind, title] of slotGroups) {
      const slots = alerts.slots.filter((s) => s.kind === kind)
      if (!slots.length) continue
      lines.push(title)
      for (const slot of slots) lines.push(formatSlotLine(slot))
    }
    if (alerts.slots.length) lines.push(`→ ${base}/#${target.id}`)
  }

  return lines.join('\n')
}

async function send(webhookUrl, content) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body: new URLSearchParams({ content }).toString(),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`teamroom webhook responded ${res.status}: ${body.slice(0, 200)}`)
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const ignoreSchedule = process.argv.includes('--ignore-schedule')
  const webhookUrl = getEnv('NATEON_TEAMROOM_WEBHOOK_URL')

  const histories = await Promise.all(TARGETS.map((target) => readHistory(target.historyPath)))
  const plan = planSend(histories.map(checkedTimes), { ignoreSchedule })
  if (!plan.send) {
    console.log(`[teamroom] 보내지 않음 — ${plan.reason}`)
    return
  }
  console.log(`[teamroom] ${formatKst(plan.since)} 이후 실행을 묶어 판정`)

  const { detectTargetAlerts, SLOT_DOWN_STREAK } = await loadDetector()
  const sections = []
  let firstCheckedAt = ''
  let latestCheckedAt = ''
  for (const [i, target] of TARGETS.entries()) {
    const alerts = detectTargetAlerts(histories[i], { since: plan.since })
    if (!alerts) {
      console.log(`[teamroom] ${target.id}: 묶을 실행 없음`)
      continue
    }
    if (!firstCheckedAt || alerts.firstCheckedAt < firstCheckedAt) firstCheckedAt = alerts.firstCheckedAt
    if (alerts.latestCheckedAt > latestCheckedAt) latestCheckedAt = alerts.latestCheckedAt
    console.log(
      `[teamroom] ${target.id}: 새 오류 ${alerts.newIssuesSkipped ? '판정 보류(이전 기록 부족)' : `${alerts.newIssues.length}건`}, 광고칸 ${alerts.slots.length}건`,
    )
    if (alerts.newIssues.length || alerts.slots.length) sections.push({ target, alerts })
  }

  if (!sections.length) {
    console.log('[teamroom] 보낼 내용 없음')
    return
  }

  const message = buildMessage(sections, {
    base: resolveDashboardBase(),
    slotStreak: SLOT_DOWN_STREAK,
    firstCheckedAt,
    latestCheckedAt,
  })

  if (dryRun || !webhookUrl) {
    console.log(`[teamroom] ${dryRun ? '--dry-run' : 'NATEON_TEAMROOM_WEBHOOK_URL 없음'} — 보내지 않고 출력만 합니다.\n`)
    console.log(message)
    return
  }

  await send(webhookUrl, message)
  console.log('[teamroom] 전송 완료')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : String(err))
  process.exitCode = 1
})
