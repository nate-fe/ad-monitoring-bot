import process from 'node:process'

async function setOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (outputPath) {
    const fs = await import('node:fs/promises')
    await fs.appendFile(outputPath, `${name}=${value}\n`, 'utf8')
  }
}

async function main() {
  if (process.env.GITHUB_EVENT_NAME !== 'schedule') {
    await setOutput('should_run', 'true')
    return
  }

  const token = process.env.GITHUB_TOKEN
  const repository = process.env.GITHUB_REPOSITORY
  const runId = String(process.env.GITHUB_RUN_ID ?? '')
  const workflow = process.env.GITHUB_WORKFLOW_FILE || 'ad-monitor.yml'

  if (!token || !repository) {
    console.warn('[schedule-gate] Missing GitHub context; running monitor.')
    await setOutput('should_run', 'true')
    return
  }

  const now = new Date()
  const hourStart = new Date(now)
  hourStart.setUTCMinutes(0, 0, 0)
  const hourStartMs = hourStart.getTime()

  const url = new URL(`https://api.github.com/repos/${repository}/actions/workflows/${workflow}/runs`)
  url.searchParams.set('event', 'schedule')
  url.searchParams.set('per_page', '30')

  const res = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  })

  if (!res.ok) {
    console.warn(`[schedule-gate] Could not list workflow runs (${res.status}); running monitor.`)
    await setOutput('should_run', 'true')
    return
  }

  const data = await res.json()
  const runs = Array.isArray(data?.workflow_runs) ? data.workflow_runs : []
  const alreadySucceededThisHour = runs.some((run) => {
    if (String(run?.id ?? '') === runId) return false
    if (run?.status !== 'completed' || run?.conclusion !== 'success') return false
    const createdAt = Date.parse(String(run?.created_at ?? ''))
    return Number.isFinite(createdAt) && createdAt >= hourStartMs
  })

  if (alreadySucceededThisHour) {
    console.log('[schedule-gate] A scheduled run already succeeded this UTC hour; skipping fallback run.')
    await setOutput('should_run', 'false')
    return
  }

  await setOutput('should_run', 'true')
}

main().catch(async (err) => {
  console.warn(`[schedule-gate] ${err instanceof Error ? err.message : String(err)}; running monitor.`)
  await setOutput('should_run', 'true')
})
