import { spawnSync } from 'node:child_process'
import { applyVercelHistoryEnv } from './apply-vercel-history-env.js'

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

applyVercelHistoryEnv()

run('npm', ['run', 'monitor:all'], { allowFail: true })
run('npm', ['run', 'history:update:all'])
run('npm', ['run', 'aliases:flat'])
run('npm', ['run', 'build'])
