import { type AdConfig, usesSize } from '../config'

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='
const UNFILLED_CSS = 'ins.adsbygoogle[data-ad-status="unfilled"]{display:none !important;}'
const LABEL_POS_CSS = {
  tl: 'top:0;left:0',
  tr: 'top:0;right:0',
  bl: 'bottom:0;left:0',
  br: 'bottom:0;right:0',
} as const

/** 작은따옴표 JS 문자열. HTML 안에 인라인으로 들어가도 깨지지 않게 </script 도 끊는다 */
export function q(value: string): string {
  const body = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/<\/script/gi, '<\\/script')
  return `'${body}'`
}

function toInt(value: string): number {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** 숫자만 입력하면 px 를 붙인다 */
export function px(value: string): string {
  const v = value.trim()
  return /^-?\d+(\.\d+)?$/.test(v) ? `${v}px` : v
}

export function parseAttrLines(text: string): [string, string][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('=')
      if (i < 0) return [line, ''] as [string, string]
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2')] as [string, string]
    })
    .filter(([k]) => k !== '')
}

/** {w} {h} 를 _adWidth/_adHeight 로 바꾼 JS 식 */
function sizeExpr(value: string): string {
  if (!/\{[wh]\}/.test(value)) return q(value)
  const parts = value.split(/(\{[wh]\})/).filter((p) => p !== '')
  return parts.map((p) => (p === '{w}' ? '_adWidth' : p === '{h}' ? '_adHeight' : q(p))).join(' + ')
}

function createWriter() {
  const lines: string[] = []
  let depth = 0
  // 닫는 줄 바로 앞의 빈 줄은 지운다
  const trimBlank = () => {
    while (lines.length && lines[lines.length - 1] === '') lines.pop()
  }
  return {
    line(s: string) {
      lines.push('  '.repeat(depth) + s)
    },
    open(s: string) {
      lines.push('  '.repeat(depth) + s)
      depth++
    },
    close(s: string) {
      trimBlank()
      depth--
      lines.push('  '.repeat(depth) + s)
    },
    /** 들여쓰기를 한 단계 내린 채로 한 줄 (} else { 같은 줄) */
    mid(s: string) {
      trimBlank()
      lines.push('  '.repeat(depth - 1) + s)
    },
    blank() {
      if (lines.length && lines[lines.length - 1] !== '') lines.push('')
    },
    text() {
      trimBlank()
      return lines.join('\n') + '\n'
    },
  }
}

type Writer = ReturnType<typeof createWriter>

function isFluidAdsense(c: AdConfig) {
  return c.kind === 'adsense' && c.adFormat !== 'fixed'
}

export function generate(c: AdConfig): string {
  const w = createWriter()

  w.open('(function () {')
  if (c.tryCatch) w.open('try {')

  if (usesSize(c)) {
    w.line(`var _adWidth = ${toInt(c.width)};`)
    w.line(`var _adHeight = ${toInt(c.height)};`)
    w.blank()
  }

  // 위치: 선택자를 입력했으면 그 요소, 비우면 스크립트 부모
  const areaSelector = c.areaSelector.trim()
  if (areaSelector) {
    const id = areaSelector.match(/^#([A-Za-z][\w-]*)$/)?.[1]
    w.line(`var _adArea = ${id ? `document.getElementById(${q(id)})` : `document.querySelector(${q(areaSelector)})`};`)
    w.open('if (!_adArea) {')
    w.line(`console.warn(${q(`[AD] ${areaSelector} 없음`)});`)
    w.line('return;')
    w.close('}')
  } else {
    w.line('var _script = document.currentScript;')
    w.line('var _adArea = _script && _script.parentNode;')
    w.line('if (!_adArea || _adArea === document.head) return;')
  }
  w.blank()

  if (c.lazy) {
    w.open('var _render = function () {')
    if (c.tryCatch) w.open('try {')
    renderBody(w, c)
    if (c.tryCatch) closeTry(w)
    w.close('};')
    w.blank()
    w.open("if ('IntersectionObserver' in window) {")
    w.open('var _io = new IntersectionObserver(function (_entries) {')
    w.line('if (!_entries[0].isIntersecting) return;')
    w.line('_io.disconnect();')
    w.line('_render();')
    w.close("}, { rootMargin: '200px 0px' });")
    w.line('_io.observe(_adArea);')
    w.mid('} else {')
    w.line('_render();')
    w.close('}')
  } else {
    renderBody(w, c)
  }

  if (c.tryCatch) closeTry(w)
  w.close('})();')
  return w.text()
}

function closeTry(w: Writer) {
  w.mid('} catch (e) {')
  w.line("console.warn('[AD]', e);")
  w.close('}')
}

function renderBody(w: Writer, c: AdConfig) {
  // 5. _adArea 스타일 — 입력한 것만
  const areaStyles: [string, string][] = [
    ['width', c.areaWidth],
    ['margin', c.areaMargin],
    ['height', c.areaHeight],
  ]
  let wroteArea = false
  for (const [prop, value] of areaStyles) {
    if (!value.trim()) continue
    w.line(`_adArea.style.${prop} = ${q(px(value))};`)
    wroteArea = true
  }
  if (wroteArea) w.blank()

  // 6. 광고를 담을 div
  w.line("var _box = document.createElement('div');")
  if (c.boxClass.trim()) w.line(`_box.className = ${q(c.boxClass.trim())};`)
  w.line("_box.style.textAlign = 'center';")
  w.line('_adArea.appendChild(_box);')
  w.blank()

  // 7. 추가 CSS + CSS로 숨김 규칙을 <style> 하나로
  const hideByCss = c.kind === 'adsense' && c.hideEmpty && c.hideMode === 'css'
  const hideByObserver = c.kind === 'adsense' && c.hideEmpty && c.hideMode === 'observe'
  const css = [c.extraCss.trim(), hideByCss ? UNFILLED_CSS : ''].filter(Boolean).join('\n')
  if (css) {
    w.line("var _style = document.createElement('style');")
    w.line(`_style.appendChild(document.createTextNode(${q(css)}));`)
    w.line('_box.appendChild(_style);')
    w.blank()
  }

  // 8. AD 라벨 홀더
  let host = '_box'
  if (c.label) {
    const blockHolder = isFluidAdsense(c) || (c.kind === 'script' && !usesSize(c))
    w.line("var _holder = document.createElement('div');")
    w.line(
      `_holder.style.cssText = ${q(
        blockHolder
          ? 'position:relative;display:block'
          : 'position:relative;display:inline-block;vertical-align:top;max-width:100%',
      )};`,
    )
    w.line('_box.appendChild(_holder);')
    w.blank()
    host = '_holder'
  }

  // 9. 광고 요소
  if (c.kind === 'iframe') {
    w.line("var _iframe = document.createElement('iframe');")
    w.line(`_iframe.src = ${q(c.iframeUrl.trim())};`)
    w.line('_iframe.width = _adWidth;')
    w.line('_iframe.height = _adHeight;')
    if (c.iframeFrameborder) w.line("_iframe.setAttribute('frameborder', '0');")
    if (c.iframeScrolling) w.line(`_iframe.setAttribute('scrolling', ${q(c.iframeScrolling)});`)
    if (c.iframeReferrerPolicy.trim()) {
      w.line(`_iframe.setAttribute('referrerpolicy', ${q(c.iframeReferrerPolicy.trim())});`)
    }
    if (c.iframeTitle.trim()) w.line(`_iframe.title = ${q(c.iframeTitle.trim())};`)
    for (const [k, v] of parseAttrLines(c.iframeExtraAttrs)) {
      w.line(`_iframe.setAttribute(${q(k)}, ${sizeExpr(v)});`)
    }
    w.line("_iframe.style.cssText = 'border:0;vertical-align:top;max-width:100%';")
    w.line("_iframe.style.width = _adWidth + 'px';")
    w.line("_iframe.style.height = _adHeight + 'px';")
    w.line(`${host}.appendChild(_iframe);`)
  } else if (c.kind === 'adsense') {
    w.line("var _ins = document.createElement('ins');")
    w.line("_ins.className = 'adsbygoogle';")
    if (c.adFormat === 'fixed') {
      w.line("_ins.style.display = 'inline-block';")
      w.line("_ins.style.width = _adWidth + 'px';")
      w.line("_ins.style.height = _adHeight + 'px';")
    } else {
      w.line("_ins.style.display = 'block';")
      if (c.adFormat === 'inarticle') w.line("_ins.style.textAlign = 'center';")
    }
    w.line(`_ins.setAttribute('data-ad-client', ${q(c.adClient.trim())});`)
    w.line(`_ins.setAttribute('data-ad-slot', ${q(c.adSlot.trim())});`)
    if (c.adFormat === 'responsive') {
      w.line("_ins.setAttribute('data-ad-format', 'auto');")
      if (c.adFullWidthResponsive) w.line("_ins.setAttribute('data-full-width-responsive', 'true');")
    } else if (c.adFormat === 'inarticle') {
      w.line("_ins.setAttribute('data-ad-layout', 'in-article');")
      w.line("_ins.setAttribute('data-ad-format', 'fluid');")
    } else if (c.adFormat === 'infeed') {
      w.line("_ins.setAttribute('data-ad-format', 'fluid');")
      w.line(`_ins.setAttribute('data-ad-layout-key', ${q(c.adLayoutKey.trim())});`)
    }
    w.line(`${host}.appendChild(_ins);`)
  } else if (c.kind === 'script') {
    w.line(`var _tag = document.createElement(${q(c.scriptTagName)});`)
    if (c.scriptTagClass.trim()) w.line(`_tag.className = ${q(c.scriptTagClass.trim())};`)
    for (const [k, v] of parseAttrLines(c.scriptTagAttrs)) {
      w.line(`_tag.setAttribute(${q(k)}, ${sizeExpr(v)});`)
    }
    if (c.scriptTagStyle.trim()) w.line(`_tag.style.cssText = ${q(c.scriptTagStyle.trim())};`)
    w.line(`${host}.appendChild(_tag);`)
  } else {
    w.line("var _adFrame = document.createElement('iframe');")
    w.line('_adFrame.width = _adWidth;')
    w.line('_adFrame.height = _adHeight;')
    w.line("_adFrame.setAttribute('frameborder', '0');")
    w.line("_adFrame.setAttribute('scrolling', 'no');")
    w.line("_adFrame.style.cssText = 'border:0;vertical-align:top;max-width:100%';")
    w.line("_adFrame.style.width = _adWidth + 'px';")
    w.line("_adFrame.style.height = _adHeight + 'px';")
    w.line(`${host}.appendChild(_adFrame);`)
    w.line('var _adDoc = _adFrame.contentWindow.document;')
    w.line('_adDoc.open();')
    w.line(
      `_adDoc.write(${q('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;}</style></head><body>')} + ${q(c.rawHtml.trim())} + ${q('</body></html>')});`,
    )
    w.line('_adDoc.close();')
  }
  w.blank()

  // 10. AD 라벨
  if (c.label) {
    w.line("var _label = document.createElement('span');")
    w.line(`_label.textContent = ${q(c.labelText || 'AD')};`)
    w.line(
      `_label.style.cssText = ${q(
        `position:absolute;${LABEL_POS_CSS[c.labelPos]};z-index:1;padding:0 4px;font:500 11px/16px sans-serif;color:#fff;background:rgba(0,0,0,.5);pointer-events:none`,
      )};`,
    )
    w.line('_holder.appendChild(_label);')
    w.blank()
  }

  // 11. 광고 없을 때 처리 (상태 감시)
  if (hideByObserver) {
    const fold = c.foldSelector.trim()
    const hideSel = c.unfilledHideSelector.trim()
    const marginBottom = c.filledMarginBottom.trim()
    const preFold = fold !== '' && c.preFold
    if (fold) {
      w.line(`var _fold = _ins.closest(${q(fold)});`)
      if (preFold) {
        w.open('if (_fold) {')
        w.line("_fold.style.overflow = 'hidden';")
        w.line("_fold.style.height = '0px';")
        w.line("_fold.style.minHeight = '0px';")
        w.close('}')
      }
    }
    w.open('new MutationObserver(function (_m, _ob) {')
    w.line("var _status = _ins.getAttribute('data-ad-status');")
    w.line('if (!_status) return;')
    w.line('_ob.disconnect();')
    w.open("if (_status === 'unfilled') {")
    if (hideSel) {
      w.line(`var _hide = _ins.closest(${q(hideSel)});`)
      w.line("if (_hide) _hide.style.display = 'none';")
    } else {
      w.line("_box.style.display = 'none';")
    }
    const filled: string[] = []
    const target = fold ? '_fold' : '_box'
    if (preFold) {
      filled.push("_fold.style.overflow = '';", "_fold.style.height = '';", "_fold.style.minHeight = '';")
    }
    if (marginBottom) filled.push(`${target}.style.marginBottom = ${q(px(marginBottom))};`)
    if (filled.length) {
      w.mid(fold ? '} else if (_fold) {' : '} else {')
      for (const l of filled) w.line(l)
    }
    w.close('}')
    if (c.parentFit) w.line('_fitParent();')
    w.close("}).observe(_ins, { attributes: true, attributeFilter: ['data-ad-status'] });")
    w.blank()
  }

  // 12. 외부 스크립트 로드 → 초기화
  if (c.kind === 'adsense') {
    w.line(`var _src = ${q(ADSENSE_SRC + c.adClient.trim())};`)
    if (c.scriptOnce) w.open("if (!document.querySelector('script[src*=\"adsbygoogle.js\"]')) {")
    w.line("var _ext = document.createElement('script');")
    w.line('_ext.src = _src;')
    w.line('_ext.async = true;')
    w.line("_ext.crossOrigin = 'anonymous';")
    w.line('(document.head || document.body).appendChild(_ext);')
    if (c.scriptOnce) w.close('}')
    w.line('(window.adsbygoogle = window.adsbygoogle || []).push({});')
    w.blank()
  } else if (c.kind === 'script') {
    writeExternalScript(w, c)
    w.blank()
  }

  // 13. 상위 프레임 높이 맞춤
  if (c.parentFit) {
    const fixedHeight = toInt(c.parentHeight)
    const areas = c.parentAreas.filter((a) => a.selector.trim())
    const name = c.parentIframeName.trim()
    w.open('var _fitParent = function () {')
    w.line(fixedHeight ? `var _h = _box.offsetHeight ? ${fixedHeight} : 0;` : 'var _h = _box.offsetHeight;')
    if (areas.length) {
      // 문서마다 따로 시도한다. 한 단계가 다른 도메인이라 막혀도 나머지는 맞춘다
      w.open('var _fit = function (_win, _selector) {')
      w.open('try {')
      w.line('var _el = _win.document.querySelector(_selector);')
      w.line('if (!_el) return;')
      w.line("_el.style.height = _h + 'px';")
      w.line("if (_el.tagName === 'IFRAME') _el.setAttribute('height', _h);")
      w.close('} catch (e) {}')
      w.close('};')
      for (const a of areas) {
        w.line(`_fit(${a.depth === 2 ? 'parent.parent' : 'parent'}, ${q(a.selector.trim())});`)
      }
    }
    if (c.parentTarget !== 'none') {
      w.open('try {')
      w.line(`var _parentFrame = ${c.parentTarget === 'parent' ? 'parent' : 'window'}.frameElement;`)
      w.open(name ? `if (_parentFrame && _parentFrame.name === ${q(name)}) {` : 'if (_parentFrame) {')
      w.line("_parentFrame.style.height = _h + 'px';")
      w.line("_parentFrame.setAttribute('height', _h);")
      w.close('}')
      w.close('} catch (e) {}')
    }
    w.close('};')
    // 애드센스는 응답 전 높이가 0이라 응답(data-ad-status)을 받은 뒤에만 맞춘다
    if (c.kind !== 'adsense') w.line('_fitParent();')
    if (c.kind === 'iframe') w.line("_iframe.addEventListener('load', _fitParent);")
    if (c.kind === 'raw') w.line('setTimeout(_fitParent, 0);')
    if (c.kind === 'script') {
      w.line("_ext.addEventListener('load', function () { setTimeout(_fitParent, 0); });")
    }
    if (c.kind === 'adsense' && !hideByObserver) {
      w.line("new MutationObserver(_fitParent).observe(_ins, { attributes: true, attributeFilter: ['data-ad-status'] });")
    }
  }
}

function writeExternalScript(w: Writer, c: AdConfig) {
  const url = c.scriptUrl.trim()
  const init = c.scriptInit
    .replace(/<\/script/gi, '<\\/script')
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+$/, ''))
  while (init.length && !init[0].trim()) init.shift()
  while (init.length && !init[init.length - 1].trim()) init.pop()
  const hasInit = init.length > 0
  const writeInit = () => {
    for (const l of init) w.line(l)
  }
  const createExt = () => {
    w.line("_ext = document.createElement('script');")
    w.line(`_ext.src = ${q(url)};`)
    w.line('_ext.async = true;')
  }
  const appendExt = '(document.head || document.body).appendChild(_ext);'

  if (!c.scriptOnce) {
    w.line("var _ext = document.createElement('script');")
    w.line(`_ext.src = ${q(url)};`)
    w.line('_ext.async = true;')
    if (hasInit && c.scriptInitTiming === 'onload') {
      w.open('_ext.onload = function () {')
      writeInit()
      w.close('};')
    }
    w.line(appendExt)
    if (hasInit && c.scriptInitTiming === 'immediate') writeInit()
    return
  }

  if (hasInit && c.scriptInitTiming === 'onload') {
    w.open('var _init = function () {')
    writeInit()
    w.close('};')
  }
  w.line(`var _ext = document.querySelector(${q(`script[src="${url}"]`)});`)
  if (hasInit && c.scriptInitTiming === 'onload') {
    w.open("if (_ext && _ext.getAttribute('data-ad-loaded')) {")
    w.line('_init();')
    w.mid('} else {')
    w.open('if (!_ext) {')
    createExt()
    w.line("_ext.addEventListener('load', function () { this.setAttribute('data-ad-loaded', '1'); });")
    w.line(appendExt)
    w.close('}')
    w.line("_ext.addEventListener('load', _init);")
    w.close('}')
  } else {
    w.open('if (!_ext) {')
    createExt()
    w.line("_ext.addEventListener('load', function () { this.setAttribute('data-ad-loaded', '1'); });")
    w.line(appendExt)
    w.close('}')
    if (hasInit) writeInit()
  }
}
