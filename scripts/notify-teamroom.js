/**
 * 하루 두 번(한국시간 9시·15시) 광고칸 미노출 현황과 새로 생긴 오류를 네이트온 팀룸(Incoming Webhook)으로 보낸다.
 *
 * - 각 회차는 그 시각 이후의 첫 실행이 보낸다. GitHub 스케줄은 몇 시간씩 밀리거나 빠지므로 9시 회차가
 *   10시 반 실행에서 나갈 수도 있지만, 다음 회차 시각(15시·다음날 9시) 전까지 실행이 하나라도 있으면 빠지지 않는다.
 * - 미노출 칸이 없어도 「없음」으로 보낸다. 알림이 안 오면 모니터링이 멈춘 것으로 알 수 있게.
 * - 오류는 지난번 보낸 실행 이후의 실행을 한 묶음으로 보고 처음 잡힌 것만 싣는다.
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

/** 이 시각(한국시간) 이후의 첫 실행이 보낸다 */
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
  // 어느 저장소에서 돌든 팀이 보는 nate-fe 대시보드로 연결한다
  return 'https://nate-fe.github.io/ad-monitoring-bot'
}

/** before 이하인 보내는 시각들(가까운 것부터) */
function* sendTimesUpTo(before) {
  const day = new Date(before + KST_OFFSET_MS)
  day.setUTCHours(0, 0, 0, 0)
  for (let dayStart = day.getTime() - KST_OFFSET_MS; dayStart > before - SEND_LOOKBACK_MS; dayStart -= 24 * HOUR_MS) {
    for (const hour of [...SEND_HOURS_KST].reverse()) {
      const at = dayStart + hour * HOUR_MS
      if (at <= before) yield at
    }
  }
}

function checkedTimes(history) {
  return history.map((it) => Date.parse(it?.checkedAt ?? '')).filter(Number.isFinite).sort((a, b) => a - b)
}

/**
 * 이번 실행이 보낼 차례인지, 보낸다면 어느 시각 이후 기록을 묶을지 정한다.
 * 상태 파일 없이 히스토리만 본다: 보내는 시각 이후의 첫 실행이 곧 그 회차에 보낸 실행이다.
 */
function planSend(timesByTarget, { ignoreSchedule }) {
  const latests = timesByTarget.map((t) => t[t.length - 1]).filter(Number.isFinite)
  if (!latests.length) return { send: false, reason: '히스토리 없음' }
  // 이번 실행에 기록이 안 남은 지면(대상 URL 없음 등)은 빼고, 이번 실행이 시작된 시각을 잡는다
  const newest = Math.max(...latests)
  const runStart = Math.min(...latests.filter((t) => newest - t <= RUN_SPREAD_MS))
  const previous = timesByTarget.flat().filter((t) => t < runStart)

  const sendTimes = sendTimesUpTo(runStart)
  const slotStart = sendTimes.next().value
  if (!ignoreSchedule && previous.some((t) => t >= slotStart)) {
    return { send: false, reason: `${formatKst(new Date(slotStart).toISOString())} 회차는 이미 앞 실행이 보냄` }
  }

  // 지난 회차들을 거슬러 가며 그 회차에 보낸 실행(회차 시각 이후 첫 실행)을 찾는다
  let windowEnd = slotStart
  for (const start of sendTimes) {
    const inWindow = previous.filter((t) => t >= start && t < windowEnd)
    windowEnd = start
    if (!inWindow.length) continue
    const sentRunStart = Math.min(...inWindow)
    const sentRunEnd = Math.max(...previous.filter((t) => t >= sentRunStart && t <= sentRunStart + RUN_SPREAD_MS))
    return { send: true, slotStart, since: new Date(sentRunEnd).toISOString() }
  }
  return { send: true, slotStart, since: new Date(windowEnd).toISOString() }
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

/** 다른 광고사 칸은 광고사 쪽 ID(숫자 등)라 알아볼 수 없으므로, 그 칸을 띄운 네이트 광고태그로 적는다 */
function slotLabel(slot) {
  return slot.parentAdTag || slot.adTag
}

function formatSlotLine(slot) {
  const missed = slot.missedAt?.length ? ` — 미노출 ${formatMissedTimes(slot.missedAt)}` : ''
  return `· ${slotLabel(slot)}${missed}`
}

/** 「3회 연속, 10. 19. 21:55부터」 */
function formatDownSlotLine(slot) {
  return `· ${slotLabel(slot)} — ${slot.missedAt.length}회 연속, ${formatKst(slot.missedAt[0])}부터`
}

function shorten(text, max = 120) {
  const t = String(text).replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

function buildMessage(sections, { base, slotStart, firstCheckedAt, latestCheckedAt }) {
  const range =
    firstCheckedAt === latestCheckedAt
      ? formatKst(latestCheckedAt)
      : `${formatKst(firstCheckedAt)} ~ ${formatKst(latestCheckedAt)}`
  const downTotal = sections.reduce((n, { alerts }) => n + (alerts?.downSlots.filter((s) => s.everRendered).length ?? 0), 0)
  const lines = [
    `[광고 모니터링] ${formatKst(slotStart)} 정기 알림 — 미노출 광고칸 ${downTotal ? `${downTotal}개` : '없음'}`,
    `검사 ${range}`,
  ]

  /** 할 말이 없는 지면은 끝에 이름만 모은다 */
  const quiet = []
  for (const { target, alerts } of sections) {
    if (!alerts) {
      quiet.push(`${target.label}(지난 알림 뒤 실행 없음)`)
      continue
    }
    const body = []

    // 지금 안 나오는 칸. 기록상 한 번도 안 나온 칸은 원래 비는 칸일 수 있어 따로 줄인다
    const wasRendering = alerts.downSlots.filter((s) => s.everRendered)
    const neverRendered = alerts.downSlots.filter((s) => !s.everRendered)
    if (!alerts.slotsMeasured) body.push('광고칸을 재지 못함(마지막 실행)')
    if (wasRendering.length) {
      body.push(`미노출 ${wasRendering.length}개`)
      for (const slot of wasRendering) body.push(formatDownSlotLine(slot))
    }
    if (neverRendered.length) {
      const labels = [...new Set(neverRendered.map(slotLabel))]
      body.push(`기록상 노출된 적 없는 칸: ${labels.join(', ')}`)
    }

    // 묶음 안에서 끊겼다가 다시 나온 칸. 그 뒤 또 안 나와 위에 실린 칸은 뺀다
    const downTags = new Set(alerts.downSlots.map((s) => s.adTag))
    const slotGroups = [
      ['recovered', '다시 노출'],
      ['bounced', '끊겼다가 다시 노출'],
    ]
    for (const [kind, title] of slotGroups) {
      const slots = alerts.slots.filter((s) => s.kind === kind && !downTags.has(s.adTag))
      if (!slots.length) continue
      body.push(title)
      for (const slot of slots) body.push(formatSlotLine(slot))
    }
    if (body.length) body.push(`→ ${base}/#${target.id}`)

    const shown = alerts.newIssues.slice(0, MAX_ISSUES_PER_TARGET)
    if (shown.length) {
      body.push(`새로 잡힌 오류 ${alerts.newIssues.length}건`)
      for (const issue of shown) {
        const level = issue.explainLevel ? `[${LEVEL_LABEL[issue.explainLevel]}] ` : ''
        // 사전에 없는 메시지는 label 이 원문 앞부분이라 원문을 한 번 더 적지 않는다
        const detail = issue.explainLevel ? ` — ${shorten(issue.sampleText, 80)}` : ''
        body.push(`· ${level}${shorten(issue.label, 80)}${detail}`)
      }
      const rest = alerts.newIssues.length - shown.length
      if (rest > 0) body.push(`· 외 ${rest}건`)
      body.push(`→ ${base}/#${target.id}/lifecycle`)
    }

    if (body.length) lines.push('', `■ ${target.label}`, ...body)
    else quiet.push(target.label)
  }
  if (quiet.length) lines.push('', `미노출·새 오류 없음: ${quiet.join(', ')}`)

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
  console.log(`[teamroom] ${formatKst(new Date(plan.slotStart).toISOString())} 회차 — ${formatKst(plan.since)} 이후 실행을 묶어 판정`)

  const { detectTargetAlerts } = await loadDetector()
  const sections = []
  let firstCheckedAt = ''
  let latestCheckedAt = ''
  for (const [i, target] of TARGETS.entries()) {
    const alerts = detectTargetAlerts(histories[i], { since: plan.since })
    if (!alerts) {
      // 대상 URL 이 없어 아예 기록이 없는 지면은 알림에서 뺀다
      console.log(`[teamroom] ${target.id}: 묶을 실행 없음`)
      if (histories[i].length) sections.push({ target, alerts: null })
      continue
    }
    if (!firstCheckedAt || alerts.firstCheckedAt < firstCheckedAt) firstCheckedAt = alerts.firstCheckedAt
    if (alerts.latestCheckedAt > latestCheckedAt) latestCheckedAt = alerts.latestCheckedAt
    console.log(
      `[teamroom] ${target.id}: 미노출 ${alerts.slotsMeasured ? `${alerts.downSlots.length}개` : '판정 불가'}, 새 오류 ${alerts.newIssuesSkipped ? '판정 보류(이전 기록 부족)' : `${alerts.newIssues.length}건`}`,
    )
    sections.push({ target, alerts })
  }

  if (!latestCheckedAt) {
    console.log('[teamroom] 보낼 내용 없음 — 지난 알림 뒤 실행 기록이 없음')
    return
  }

  const message = buildMessage(sections, {
    base: resolveDashboardBase(),
    slotStart: new Date(plan.slotStart).toISOString(),
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
