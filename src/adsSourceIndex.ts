// 광고 스크립트 원문 인덱스.
// 검색할 때만 동적 import 되므로, 초기 번들에는 포함되지 않는다.
const raw = import.meta.glob('./ads/**/*.{js,txt,html}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const adScriptSources: Record<string, string> = raw
