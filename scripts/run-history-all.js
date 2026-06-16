import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { applyHistoryEnv } from './apply-history-env.js'

applyHistoryEnv()

function runScope(scope) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [path.resolve(process.cwd(), 'scripts', 'run-history-target.js'), scope],
      {
        stdio: 'inherit',
        env: process.env,
      },
    )

    child.on('exit', (code) => {
      resolve(code ?? 1)
    })
  })
}

const scopes = ['news', 'news-home', 'pann', 'pann-home', 'news-pc', 'news-pc-home', 'pann-pc', 'pann-pc-home']
let hasFailure = false

for (const scope of scopes) {
  const code = await runScope(scope)
  if (code !== 0) hasFailure = true
}

process.exit(hasFailure ? 1 : 0)
