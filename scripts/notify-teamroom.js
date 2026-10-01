/**
 * 이번 실행에서 새로 생긴 문제만 네이트온 팀룸(Incoming Webhook)으로 보낸다.
 *
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

function shorten(text, max = 120) {
  const t = String(text).replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

function buildMessage(sections, { base, slotStreak, checkedAt }) {
  const lines = [`[광고 모니터링] ${formatKst(checkedAt)} 검사 결과`]

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

    const down = alerts.slots.filter((s) => s.kind === 'down')
    const recovered = alerts.slots.filter((s) => s.kind === 'recovered')
    if (down.length) lines.push(`광고칸 ${slotStreak}회 연속 미노출: ${down.map((s) => s.adTag).join(', ')}`)
    if (recovered.length) lines.push(`광고칸 다시 노출: ${recovered.map((s) => s.adTag).join(', ')}`)
    if (down.length || recovered.length) lines.push(`→ ${base}/#${target.id}`)
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
  const webhookUrl = getEnv('NATEON_TEAMROOM_WEBHOOK_URL')
  const { detectTargetAlerts, SLOT_DOWN_STREAK } = await loadDetector()

  const sections = []
  let latestCheckedAt = ''
  for (const target of TARGETS) {
    const alerts = detectTargetAlerts(await readHistory(target.historyPath))
    if (!alerts) {
      console.log(`[teamroom] ${target.id}: 히스토리 없음`)
      continue
    }
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
    checkedAt: latestCheckedAt,
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
