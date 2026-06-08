export async function fetchJsonFromPaths<T>(paths: string[]) {
  let lastError = '리포트를 불러오지 못했습니다.'

  for (const path of paths) {
    try {
      const cacheBust = Date.now()
      const url = `${import.meta.env.BASE_URL}${path}?ts=${cacheBust}`
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) {
        lastError = `${path} 불러오기 실패 (HTTP ${res.status})`
        continue
      }
      return (await res.json()) as T
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
    }
  }

  throw new Error(lastError)
}
