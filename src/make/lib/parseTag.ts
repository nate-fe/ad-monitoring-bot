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
  // 속성이 없으면 script src 의 320x150 같은 표기에서 찾는다
  for (const s of Array.from(doc.querySelectorAll('script[src]'))) {
    const m = (s.getAttribute('src') ?? '').match(/(?:^|[^\d])(\d{2,4})[x×](\d{2,4})(?!\d)/i)
    if (m) return { width: m[1], height: m[2] }
  }
  return { width: '', height: '' }
}

/** 외부 script 종류로 옮겨도 동작이 같은 script 속성 (나머지는 원본 태그로 둔다) */
const PLAIN_SCRIPT_ATTRS = new Set(['src', 'async', 'defer', 'type', 'language', 'crossorigin'])

function isJsType(s: Element): boolean {
  const type = (s.getAttribute('type') ?? '').trim().toLowerCase()
  return type === '' || type === 'text/javascript' || type === 'application/javascript'
}

/**
 * 외부 script 종류는 "SDK 1개를 불러온 뒤 인라인 코드를 초기화로 실행" 하는 구조만 표현할 수 있다.
 * SDK 가 여러 개이거나, SDK 보다 먼저 실행할 설정 코드가 있거나, script 에 data-·charset 같은 속성이 있으면
 * 옮기는 순간 동작이 달라지므로 원본 태그로 둔다.
 */
function fitsScriptKind(scripts: Element[], external: Element): boolean {
  if (scripts.filter((s) => s.getAttribute('src')).length !== 1) return false
  if (!Array.from(external.attributes).every((a) => PLAIN_SCRIPT_ATTRS.has(a.name.toLowerCase()))) return false
  if (!isJsType(external)) return false
  const at = scripts.indexOf(external)
  return scripts.every((s, i) => s === external || (i > at && isJsType(s) && s.attributes.length === 0))
}

export function parseTag(input: string): Parsed | null {
  const text = cleanMessengerLinks(input).trim()
  if (!text) return null

  // URL 한 줄
  if (!/[<>\s]/.test(text) && /^(https?:)?\/\//i.test(text)) {
    return { kind: 'iframe', patch: { kind: 'iframe', iframeUrl: text }, summary: 'iframe (URL 한 줄) · 크기는 아래에서 고르세요' }
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
      summary: `iframe · ${size.width && size.height ? `${size.width}×${size.height}` : '크기를 찾지 못함, 직접 입력'}${extra ? ' · 추가 속성 있음' : ''}`,
    }
  }

  const external = scripts.find((s) => s.getAttribute('src'))
  const tag = Array.from(doc.querySelectorAll('ins, div')).find((el) => !el.closest('script'))
  if (external && tag && !hasDocWrite && fitsScriptKind(scripts, external)) {
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
    const hasSize = Boolean(size.width && size.height)
    return {
      kind: 'raw',
      patch: { kind: 'raw', rawHtml: text, ...(hasSize ? size : {}) },
      summary: `${hasDocWrite ? '원본 태그 (document.write 포함, 격리 실행)' : '원본 태그 (격리 실행)'} · ${
        hasSize ? `${size.width}×${size.height}` : '크기를 찾지 못함, 직접 입력'
      }`,
    }
  }

  return null
}
