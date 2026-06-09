/**
 * 외부 스케줄러(cron-job.org 등) 또는 수동 호출로 프로덕션 재배포(Deploy Hook)를 트리거합니다.
 * Authorization: Bearer <CRON_SECRET> 헤더로 보호합니다.
 */
export default async function handler(request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hookUrl) {
    return Response.json(
      { ok: false, error: 'VERCEL_DEPLOY_HOOK_URL is not configured in Vercel environment variables.' },
      { status: 500 },
    )
  }

  const hookResponse = await fetch(hookUrl, { method: 'POST' })
  if (!hookResponse.ok) {
    const body = await hookResponse.text().catch(() => '')
    return Response.json(
      {
        ok: false,
        error: `Deploy hook failed with HTTP ${hookResponse.status}`,
        detail: body.slice(0, 500),
      },
      { status: 502 },
    )
  }

  return Response.json({ ok: true, redeploy: 'triggered' })
}
