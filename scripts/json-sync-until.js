export function parseJsonSyncUntilMs(value = process.env.JSON_SYNC_UNTIL) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return Date.parse(`${trimmed}T23:59:59.999Z`)
  }

  const parsed = Date.parse(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function filterHistoryJsonByUntil(raw, untilMs) {
  if (!untilMs) return raw

  const data = JSON.parse(raw)
  if (!Array.isArray(data)) return raw

  const filtered = data.filter((item) => {
    const checkedAt = Date.parse(String(item?.checkedAt ?? ''))
    return Number.isFinite(checkedAt) && checkedAt <= untilMs
  })

  return JSON.stringify(filtered, null, 2)
}
