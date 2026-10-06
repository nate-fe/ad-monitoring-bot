import type { AdConfig, AdsenseFormat } from '../config'

export interface Parsed {
  kind: AdConfig['kind']
  patch: Partial<AdConfig>
  summary: string
}

/** 메신저가 붙인 [https://…](https://…) 흔적을 지우고 원래 URL만 남긴다 */
export function cleanMessengerLinks(text: string): string {
  return text.replace(/\[([^\]\n]+)\]\(((?:https?:)?\/\/[^)\s]+)\)/g, (_m, label: string, href: string) =>
    /^(https?:)?\/\//.test(label) ? label : href,
  )
}

function num(value: string | null | undefined): string {
  const m = (value ?? '').match(/\d+/)
  return m ? m[0] : ''
}

function styleSize(el: Element, prop: 'width' | 'height'): string {
  const style = el.getAttribute('style') ?? ''
  const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*(\\d+)px`, 'i'))
  return m ? m[1] : ''
}

function sizeOf(el: Element): { width: string; height: string } {
  return {
    width: num(el.getAttribute('width')) || styleSize(el, 'width'),
    height: num(el.getAttribute('height')) || styleSize(el, 'height'),
  }
}

function findSize(doc: Document): { width: string; height: string } {
  for (const el of Array.from(doc.querySelectorAll('[width][height], [style*="width"]'))) {
    const s = sizeOf(el)
    if (s.width && s.height) return s
  }
  return { width: '', height: '' }
}

export function parseTag(input: string): Parsed | null {
  const text = cleanMessengerLinks(input).trim()
  if (!text) return null

  // URL 한 줄
  if (!/[<>\s]/.test(text) && /^(https?:)?\/\//i.test(text)) {
    return { kind: 'iframe', patch: { kind: 'iframe', iframeUrl: text }, summary: 'URL 한 줄 → iframe URL' }
  }

  // 분석만 하고 실행하지 않는다 (DOMParser 문서의 script 는 실행되지 않음)
  const doc = new DOMParser().parseFromString(text, 'text/html')
  const scripts = Array.from(doc.querySelectorAll('script'))
  const hasDocWrite = scripts.some((s) => /document\.write(ln)?\s*\(/.test(s.textContent ?? ''))

  const ins = doc.querySelector('ins.adsbygoogle')
  if (ins && !hasDocWrite) {
    const client = ins.getAttribute('data-ad-client') ?? ''
    const slot = ins.getAttribute('data-ad-slot') ?? ''
    const fmt = (ins.getAttribute('data-ad-format') ?? '').toLowerCase()
    const layout = (ins.getAttribute('data-ad-layout') ?? '').toLowerCase()
    const layoutKey = ins.getAttribute('data-ad-layout-key') ?? ''
    let adFormat: AdsenseFormat = 'fixed'
    if (layout === 'in-article') adFormat = 'inarticle'
    else if (layoutKey || (fmt === 'fluid' && layout !== 'in-article')) adFormat = 'infeed'
    else if (fmt === 'auto' || fmt.includes('horizontal') || fmt.includes('rectangle') || fmt.includes('vertical'))
      adFormat = 'responsive'
    const size = sizeOf(ins)
    if (adFormat === 'fixed' && !(size.width && size.height)) adFormat = 'responsive'
    return {
      kind: 'adsense',
      patch: {
        kind: 'adsense',
        adClient: client,
        adSlot: slot,
        adFormat,
        adLayoutKey: layoutKey,
        adFullWidthResponsive: ins.getAttribute('data-full-width-responsive') === 'true',
        ...(adFormat === 'fixed' ? size : {}),
      },
      summary: `애드센스 · ${client || 'client 없음'} / slot ${slot || '없음'} / ${adFormat}`,
    }
  }

  const iframe = doc.querySelector('iframe')
  if (iframe && !hasDocWrite) {
    const known = new Set(['src', 'width', 'height', 'scrolling', 'referrerpolicy', 'title', 'frameborder', 'style'])
    const extra = Array.from(iframe.attributes)
      .filter((a) => !known.has(a.name.toLowerCase()))
      .map((a) => `${a.name}=${a.value}`)
      .join('\n')
    const size = sizeOf(iframe)
    return {
      kind: 'iframe',
      patch: {
        kind: 'iframe',
        iframeUrl: iframe.getAttribute('src') ?? '',
        ...size,
        iframeScrolling: iframe.getAttribute('scrolling') ?? 'no',
        iframeReferrerPolicy: iframe.getAttribute('referrerpolicy') ?? '',
        iframeTitle: iframe.getAttribute('title') ?? '',
        iframeFrameborder: true,
        iframeExtraAttrs: extra,
      },
      summary: `iframe · ${size.width || '?'}×${size.height || '?'}${extra ? ' · 추가 속성 있음' : ''}`,
    }
  }

  const external = scripts.find((s) => s.getAttribute('src'))
  const tag = Array.from(doc.querySelectorAll('ins, div')).find((el) => !el.closest('script'))
  if (external && tag && !hasDocWrite) {
    const attrs = Array.from(tag.attributes)
      .filter((a) => a.name !== 'class' && a.name !== 'style' && a.name !== 'id')
      .map((a) => `${a.name}=${a.value}`)
    const id = tag.getAttribute('id')
    if (id) attrs.unshift(`id=${id}`)
    const inline = scripts
      .filter((s) => !s.getAttribute('src'))
      .map((s) => (s.textContent ?? '').trim())
      .filter(Boolean)
      .join('\n')
    const size = sizeOf(tag)
    return {
      kind: 'script',
      patch: {
        kind: 'script',
        scriptUrl: external.getAttribute('src') ?? '',
        scriptTagName: tag.tagName.toLowerCase() === 'div' ? 'div' : 'ins',
        scriptTagClass: tag.getAttribute('class') ?? '',
        scriptTagAttrs: attrs.join('\n'),
        scriptTagStyle: tag.getAttribute('style') ?? '',
        scriptInit: inline,
        scriptInitTiming: 'onload',
        ...(size.width && size.height ? size : { width: '', height: '' }),
      },
      summary: `외부 script · ${tag.tagName.toLowerCase()}${tag.getAttribute('class') ? `.${tag.getAttribute('class')}` : ''}${inline ? ' · 초기화 코드 있음' : ''}`,
    }
  }

  if (scripts.length || hasDocWrite || /<\w/.test(text)) {
    const size = findSize(doc)
    return {
      kind: 'raw',
      patch: { kind: 'raw', rawHtml: text, ...(size.width && size.height ? size : {}) },
      summary: hasDocWrite ? '원본 태그 (document.write 포함, 격리 실행)' : '원본 태그 (격리 실행)',
    }
  }

  return null
}
