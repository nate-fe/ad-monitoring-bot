import { type AdConfig, needsSize } from '../config'
import { parseTag } from './parseTag'

export type WarningLevel = 'error' | 'warn' | 'info'

export interface Warning {
  level: WarningLevel
  message: string
}

function isSelectorValid(selector: string): boolean {
  try {
    document.createDocumentFragment().querySelector(selector)
    return true
  } catch {
    return false
  }
}

function checkUrl(label: string, url: string, out: Warning[]) {
  const v = url.trim()
  if (!v) return
  if (/^http:\/\//i.test(v)) {
    out.push({ level: 'warn', message: `${label}이 http:// 입니다. https 페이지에서는 혼합 콘텐츠로 막힐 수 있습니다.` })
  } else if (/^\/\//.test(v)) {
    out.push({ level: 'info', message: `${label}이 //로 시작합니다. 페이지 프로토콜(https)을 따라갑니다.` })
  }
  if (!/^(https?:)?\/\/[^\s/?#]+\.[^\s/?#]+[^\s]*$/i.test(v)) {
    out.push({ level: 'warn', message: `${label} 형식이 이상합니다: ${v.length > 60 ? `${v.slice(0, 60)}…` : v}` })
  }
}

export function validate(c: AdConfig): Warning[] {
  const out: Warning[] = []

  // 태그가 없거나 인식하지 못하면 나머지 값은 아직 의미가 없다
  if (!c.source.trim()) return [{ level: 'error', message: '광고 업체가 준 태그를 붙여넣으세요.' }]
  if (!parseTag(c.source)) {
    return [{ level: 'error', message: '태그를 인식하지 못했습니다. 업체가 준 HTML 태그나 광고 URL을 그대로 붙여넣으세요.' }]
  }

  if (needsSize(c)) {
    const w = parseInt(c.width, 10)
    const h = parseInt(c.height, 10)
    if (!(w > 0) || !(h > 0)) out.push({ level: 'error', message: '크기(W×H)를 고르세요. 태그에서 크기를 찾지 못했습니다.' })
  }

  if (c.kind === 'iframe') {
    if (!c.iframeUrl.trim()) out.push({ level: 'error', message: '태그의 iframe에 src가 없습니다.' })
    checkUrl('iframe URL', c.iframeUrl, out)
  }

  if (c.kind === 'adsense') {
    if (!/^ca-pub-\d+$/.test(c.adClient.trim())) {
      out.push({ level: 'error', message: '태그의 data-ad-client가 ca-pub-숫자 형식이 아닙니다.' })
    }
    if (!c.adSlot.trim()) out.push({ level: 'error', message: '태그에 data-ad-slot이 없습니다.' })
    if (c.adFormat === 'infeed' && !c.adLayoutKey.trim()) {
      out.push({ level: 'error', message: '인피드 광고인데 태그에 data-ad-layout-key가 없습니다.' })
    }
  }

  if (c.kind === 'script') {
    if (!c.scriptUrl.trim()) out.push({ level: 'warn', message: '외부 스크립트 URL이 비어 있습니다.' })
    checkUrl('스크립트 URL', c.scriptUrl, out)
    if (/document\.write\s*\(/.test(c.scriptInit)) {
      out.push({
        level: 'warn',
        message: '초기화 코드에 document.write가 있습니다. 비동기로 실행되면 페이지가 지워질 수 있으니 원본 태그 종류를 쓰세요.',
      })
    }
  }

  if (c.kind === 'raw' && !c.rawHtml.trim()) {
    out.push({ level: 'error', message: '원본 태그가 비어 있습니다.' })
  }

  const selectors: [string, string, WarningLevel][] = [
    ['광고 위치 선택자', c.areaSelector, 'error'],
    ['접을 요소 선택자', c.kind === 'adsense' && c.hideEmpty ? c.foldSelector : '', 'error'],
    ['unfilled일 때 숨길 요소 선택자', c.kind === 'adsense' && c.hideEmpty ? c.unfilledHideSelector : '', 'error'],
    ...(c.parentFit ? c.parentAreas : []).map(
      (a): [string, string, WarningLevel] => [a.depth === 2 ? '그 위 문서 요소 선택자' : '상위 문서 요소 선택자', a.selector, 'error'],
    ),
  ]
  for (const [label, value, level] of selectors) {
    if (value.trim() && !isSelectorValid(value.trim())) {
      out.push({ level, message: `${label} 문법이 잘못되었습니다: ${value.trim()}` })
    }
  }

  if (c.parentFit) {
    const hasAreas = c.parentAreas.some((a) => a.selector.trim())
    if (c.parentTarget === 'none' && !hasAreas) {
      out.push({ level: 'warn', message: '상위 프레임 높이 맞춤: 높이를 맞출 요소의 선택자를 입력하세요.' })
    }
    out.push({ level: 'info', message: '상위 문서가 다른 도메인이면 높이 맞춤은 건너뜁니다(오류 없이 무시).' })
  }

  return out
}

export function hasError(warnings: Warning[]): boolean {
  return warnings.some((w) => w.level === 'error')
}
