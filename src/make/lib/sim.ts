import type { AdConfig } from '../config'
import { stubScript } from './simStub'

export type SimPage = 'article' | 'feed' | 'main'

/** 접기·숨김 선택자를 쓰면 .feed-item.ad > .adloader 구조가 있는 피드 페이지에서 돌린다 */
export function pickSimPage(cfg: AdConfig): SimPage {
  const usesFeed = cfg.kind === 'adsense' && cfg.hideEmpty && cfg.hideMode === 'observe' && (cfg.foldSelector.trim() || cfg.unfilledHideSelector.trim())
  return usesFeed ? 'feed' : 'article'
}

export interface SimOptions {
  run: string
  page: SimPage
  fill: boolean
}

export interface SimBuild {
  html: string
  notes: string[]
  /** 가상 페이지를 만들 수 없어 실행 검사를 건너뛸 때 그 이유 */
  skipReason?: string
}

/** 실제 광고 서버를 부르지 않도록 문서마다 네트워크를 막는다 (인라인 script·style·data: 만 허용) */
const CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; frame-src about: data:"

function attr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function inlineScript(code: string): string {
  // 생성 코드는 이미 </script 를 끊어 두었지만, 붙여넣은 값이 섞일 수 있어 한 번 더
  return `<script>${code.replace(/<\/script/gi, '<\\/script')}</script>`
}

function docShell(label: string, opts: Record<string, unknown>, bodyStyle: string, body: string, headExtra = ''): string {
  return [
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">`,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    inlineScript(stubScript(label, opts)),
    headExtra,
    `</head><body style="${bodyStyle}">`,
    body,
    '</body></html>',
  ].join('')
}

/** #id / .class / tag.class 처럼 단순한 선택자면 그 선택자에 맞는 요소로 inner 를 감싼다 */
function wrapForSelector(selector: string, inner: string, extraAttrs = ''): string | null {
  const m = selector.trim().match(/^([a-zA-Z][\w-]*)?((?:[#.][\w-]+)+)?$/)
  if (!m || (!m[1] && !m[2])) return null
  const tag = m[1] || 'div'
  const id = (m[2] ?? '').match(/#([\w-]+)/)?.[1]
  const classes = Array.from((m[2] ?? '').matchAll(/\.([\w-]+)/g)).map((x) => x[1])
  return `<${tag}${id ? ` id="${id}"` : ''}${classes.length ? ` class="${classes.join(' ')}"` : ''}${extraAttrs}>${inner}</${tag}>`
}

const PAGE_CSS = `
*{box-sizing:border-box}
body{margin:0;font:15px/1.6 -apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1d2230;background:#fff}
.sim-gnb{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:8px;height:48px;padding:0 16px;background:#fff;border-bottom:1px solid #e6e8ef;font-weight:700}
.sim-gnb b{color:#ff3b30}
.sim-wrap{padding:16px}
.sim-wrap h1{font-size:20px;line-height:1.35;margin:4px 0 6px}
.sim-meta{color:#8a90a2;font-size:12px;margin:0 0 14px}
.sim-wrap p{margin:0 0 14px}
.sim-ph{display:block;height:10px;border-radius:5px;background:#eceef4;margin:8px 0}
.sim-ph.sim-short{width:60%}
.sim-ad-slot{margin:18px 0}
.sim-feed{list-style:none;margin:0;padding:0}
.feed-item{display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid #eef0f5}
.feed-item .sim-th{flex:0 0 84px;height:60px;border-radius:6px;background:#e3e7f1}
.feed-item .sim-tx{flex:1}
.feed-item.ad{display:block;padding:0;border:0}
.sim-search{margin:12px 16px;height:40px;border-radius:20px;border:2px solid #ff3b30}
.sim-ad-top{margin:0 0 12px}
.sim-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:0 16px 16px}
.sim-card{height:110px;border-radius:8px;background:#eef1f7}
`

// 가상 페이지 자체의 class 는 sim- 으로 시작한다. 입력한 위치 선택자(.ad_area 등)와 겹치지 않게.
// 단, 피드의 .feed-item.ad > .adloader 는 접기 옵션을 시험하려고 실제 구조를 그대로 둔다.
function articleLines(n: number): string {
  return Array.from(
    { length: n },
    (_, i) => `<p><span class="sim-ph"></span><span class="sim-ph"></span><span class="sim-ph${i % 2 ? ' sim-short' : ''}"></span></p>`,
  ).join('')
}

function feedItems(from: number, n: number): string {
  return Array.from(
    { length: n },
    (_, i) =>
      `<li class="feed-item"><span class="sim-th"></span><span class="sim-tx"><b>피드 기사 ${from + i}</b><span class="sim-ph"></span><span class="sim-ph sim-short"></span></span></li>`,
  ).join('')
}

function pageBody(page: SimPage, slot: string): string {
  if (page === 'feed') {
    return `<header class="sim-gnb"><b>NATE</b> 뉴스 피드</header><ul class="sim-feed">${feedItems(1, 3)}<li class="feed-item ad"><div class="adloader">${slot}</div></li>${feedItems(4, 6)}</ul>`
  }
  if (page === 'main') {
    return `<header class="sim-gnb"><b>NATE</b></header><div class="sim-search"></div><div class="sim-ad-top">${slot}</div><div class="sim-cards">${'<div class="sim-card"></div>'.repeat(10)}</div>`
  }
  return `<header class="sim-gnb"><b>NATE</b> 뉴스</header><article class="sim-wrap"><h1>가상 기사 제목입니다</h1><p class="sim-meta">2026.10.01 09:00 · 가상언론</p>${articleLines(4)}<div class="sim-ad-slot">${slot}</div>${articleLines(8)}</article>`
}

export function buildSimDoc(code: string, cfg: AdConfig, opt: SimOptions): SimBuild {
  const notes: string[] = []
  const base = { run: opt.run, fill: opt.fill }
  // 광고 위치 선택자를 쓰면 그 요소를 만들어 둔다 (스크립트도 그 안에 둠)
  const areaSelector = cfg.areaSelector.trim()
  let adSlot = `<div data-sim-slot>${inlineScript(code)}</div>`
  if (areaSelector) {
    const wrapped = wrapForSelector(areaSelector, inlineScript(code), ' data-sim-slot')
    if (!wrapped) {
      return { html: '', notes, skipReason: `광고 위치 「${areaSelector}」가 #id·.class 같은 단순 선택자가 아니라 가상 페이지에 만들 수 없습니다.` }
    }
    adSlot = wrapped
  }

  if (!cfg.parentFit) {
    const html = docShell('페이지', { ...base, adDoc: true, area: areaSelector }, '', pageBody(opt.page, adSlot), `<style>${PAGE_CSS}</style>`)
    return { html, notes }
  }

  // 최상위 페이지(= parent.parent) → iframe[name] → 상위 문서(= parent) → iframe → 광고 문서
  const name = cfg.parentIframeName.trim() || 'ad_frame'
  const outerName = cfg.parentTarget === 'parent' ? name : 'ad_outer'
  const innerName = cfg.parentTarget === 'window' ? name : ''
  const adDoc = docShell('광고 문서', { ...base, adDoc: true, area: areaSelector }, 'margin:0', adSlot)
  const innerFrame = `<iframe${innerName ? ` name="${attr(innerName)}"` : ''} srcdoc="${attr(adDoc)}" style="display:block;width:100%;height:250px;border:0"></iframe>`

  // 높이를 바꿀 상위 요소를 그 단계 문서에 만든다. "#x iframe" 은 #x 안에 iframe 이 있으면 저절로 맞는다
  const wrapAreas = (inner: string, depth: 1 | 2) => {
    let out = inner
    const seen = new Set<string>()
    for (const area of cfg.parentAreas) {
      if (area.depth !== depth) continue
      const sel = area.selector.trim().replace(/\s+iframe$/i, '')
      if (!sel || seen.has(sel)) continue
      seen.add(sel)
      const wrapped = wrapForSelector(sel, out, ' style="height:250px;overflow:hidden"')
      if (wrapped) out = wrapped
      else notes.push(`상위 요소 「${area.selector}」는 단순 선택자가 아니라 가상 페이지에 만들지 못했습니다.`)
    }
    return out
  }

  const middleDoc = docShell('iframe 문서', base, 'margin:0', wrapAreas(innerFrame, 1))
  const outerFrame = `<iframe name="${attr(outerName)}" srcdoc="${attr(middleDoc)}" style="display:block;width:100%;height:250px;border:0"></iframe>`

  const html = docShell('페이지', base, '', pageBody(opt.page, wrapAreas(outerFrame, 2)), `<style>${PAGE_CSS}</style>`)
  return { html, notes }
}
