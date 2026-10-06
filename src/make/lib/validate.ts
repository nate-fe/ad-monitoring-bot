import { type AdConfig, needsSize } from '../config'

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

  if (needsSize(c)) {
    const w = parseInt(c.width, 10)
    const h = parseInt(c.height, 10)
    if (!(w > 0) || !(h > 0)) out.push({ level: 'error', message: '크기(W×H)를 입력하세요.' })
  }

  if (c.kind === 'iframe') {
    if (!c.iframeUrl.trim()) out.push({ level: 'error', message: 'iframe URL을 입력하세요.' })
    checkUrl('iframe URL', c.iframeUrl, out)
  }

  if (c.kind === 'adsense') {
    if (!/^ca-pub-\d+$/.test(c.adClient.trim())) {
      out.push({ level: 'error', message: '애드센스 client는 ca-pub-숫자 형식이어야 합니다.' })
    }
    if (!c.adSlot.trim()) out.push({ level: 'error', message: '애드센스 slot을 입력하세요.' })
    if (c.adFormat === 'infeed' && !c.adLayoutKey.trim()) {
      out.push({ level: 'error', message: '인피드 형식은 layout-key가 필요합니다.' })
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
      out.push({ level: 'warn', message: '상위 프레임 높이 맞춤: 높이를 바꿀 iframe도, 상위 문서 요소도 없어 아무것도 바꾸지 않습니다.' })
    } else if (c.parentTarget !== 'none' && !hasAreas && !c.parentIframeName.trim()) {
      out.push({
        level: 'warn',
        message: '상위 프레임 높이 맞춤: 상위 문서 요소와 iframe name이 둘 다 없어 frameElement를 이름 확인 없이 바꿉니다.',
      })
    }
    out.push({ level: 'info', message: '상위 문서가 다른 도메인이면 높이 맞춤은 건너뜁니다(오류 없이 무시).' })
  }

  return out
}

export function hasError(warnings: Warning[]): boolean {
  return warnings.some((w) => w.level === 'error')
}
