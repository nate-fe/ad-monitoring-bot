import { spawnSync } from 'node:child_process'
import { applyVercelHistoryEnv } from './apply-vercel-history-env.js'

function parseBool(value) {
  const v = String(value ?? '').trim().toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(v)
}

function run(command, args, { allowFail = false } = {}) {
  console.log(`[vercel-build] ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })

  if (result.status !== 0 && !allowFail) {
    process.exit(result.status ?? 1)
  }
}

const runMonitor = parseBool(process.env.RUN_MONITOR_ON_BUILD)

applyVercelHistoryEnv()

if (runMonitor) {
  console.log('[vercel-build] RUN_MONITOR_ON_BUILD=true — running monitor pipeline')
  run('npx', ['playwright', 'install', '--with-deps', 'chromium'], { allowFail: true })
  run('npm', ['run', 'monitor:all'], { allowFail: true })
  run('npm', ['run', 'history:update:all'], { allowFail: true })
  run('npm', ['run', 'aliases:flat'], { allowFail: true })
} else {
  console.log('[vercel-build] Skipping monitor (set RUN_MONITOR_ON_BUILD=true to enable on Vercel build)')
}

run('npm', ['run', 'build'])
