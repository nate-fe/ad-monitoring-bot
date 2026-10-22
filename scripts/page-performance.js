/**
 * 페이지 성능 중 「광고가 지면에 주는 부담」을 재는 두 가지.
 *  - CLS: 레이아웃이 밀린 정도(Core Web Vitals 정의 — 세션 창 중 최대값)
 *  - 스크립트 용량: 측정 중 받은 모든 script 요청의 전송 크기(압축)와 원본 크기
 */

/** 광고 스크립트로 보는 주소. 광고 iframe 안에서 받은 스크립트는 주소와 상관없이 광고로 센다 */
export const AD_SCRIPT_URL_RE =
  /cyad\d*\.nate\.com|nate\.com\/etc\/ad|pstatic\.net\/(?:tveta|melona)|igaw\.io|3dpop\.kr|coupang(?:cdn)?\.com\/widget|googlesyndication|doubleclick|googletagmanager\.com\/gtag|pagead2|adservice|taboola|criteo|adnxs|amazon-adsystem|casalemedia|pubmatic|rubiconproject|openx|prebid|adform|adsafeprotected|2mdn\.net|creativecdn|spotx|outbrain|facebook\.net\/|connect\.facebook|dable|widerplanet|mobwith|googletagservices|gpt\.js|pubads\.gmpubads|securepubads\.g\.doubleclick/i

/** 자사 지면·정적 파일 호스트 */
const FIRST_PARTY_HOST_RE = /(^|\.)(nate\.com|nateimg\.co\.kr)$/i

const LAYOUT_SHIFT_TOP_N = 8
const SCRIPT_TOP_N = 15
const HOST_TOP_N = 8
const SIZE_WAIT_MS = 5000

/**
 * layout-shift 를 네비게이션 전부터 모은다. 지면 레이아웃은 최상위 문서 기준이라 iframe 에서는 돌지 않는다.
 * 밀린 요소는 그 순간에만 살아 있을 수 있어서, 이름(선택자)과 위치를 받을 때 바로 적어 둔다.
 */
export const LAYOUT_SHIFT_CAPTURE_SCRIPT = `
(() => {
  if (window !== window.top) return;
  const key = '__adMonitorLayoutShifts__';
  if (globalThis[key]) return;
  const shifts = [];
  Object.defineProperty(globalThis, key, { value: shifts, configurable: false, enumerable: false, writable: false });
  const AD_HINT = /(^|[^a-z])(ad|ads|adv|advert|banner|dable|criteo|gpt|google_ads|aswift|taboola|mobwith)([^a-z]|$)|ad_|_ad|adArea|adWrap|ifr_/i;
  const describe = (node) => {
    if (!node || node.nodeType !== 1) return node && node.nodeType === 3 ? '#text' : undefined;
    let s = node.tagName.toLowerCase();
    if (node.id) s += '#' + node.id;
    const cls = typeof node.className === 'string' ? node.className.trim().split(/\\s+/).filter(Boolean).slice(0, 2) : [];
    if (cls.length) s += '.' + cls.join('.');
    return s.slice(0, 120);
  };
  const anchorOf = (node) => {
    let el = node && node.nodeType === 1 ? node : node && node.parentElement;
    for (let depth = 0; el && depth < 12; depth += 1, el = el.parentElement) {
      if (el.id && el !== document.body && el !== document.documentElement) return '#' + el.id;
    }
    return undefined;
  };
  const adLike = (node) => {
    let el = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (el && el.querySelector && el.querySelector('iframe, ins.adsbygoogle')) return true;
    for (let depth = 0; el && depth < 8; depth += 1, el = el.parentElement) {
      if (el.tagName === 'IFRAME' || el.tagName === 'INS') return true;
      const name = (el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : '');
      if (AD_HINT.test(name)) return true;
    }
    return false;
  };
  try {
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const sources = [];
        for (const src of e.sources || []) {
          if (sources.length >= 3) break;
          sources.push({
            node: describe(src.node),
            anchor: anchorOf(src.node),
            adLike: adLike(src.node),
            fromY: Math.round(src.previousRect.y + scrollY),
            toY: Math.round(src.currentRect.y + scrollY),
            fromHeight: Math.round(src.previousRect.height),
            toHeight: Math.round(src.currentRect.height),
          });
        }
        shifts.push({ value: e.value, startTime: e.startTime, hadRecentInput: e.hadRecentInput, sources });
      }
    });
    po.observe({ type: 'layout-shift', buffered: true });
  } catch (_) {
    shifts._observeFailed = true;
  }
})();
`

/** web-vitals 와 같은 방식: 1초 안에 이어진 이동을 묶되 한 묶음은 5초를 넘지 않고, 가장 큰 묶음이 CLS */
function computeCls(shifts) {
  let cls = 0
  let windowValue = 0
  let windowStart = -Infinity
  let last = -Infinity
  let worst = { start: 0, end: 0 }
  let curStart = 0
  for (const s of shifts) {
    if (s.startTime - last < 1000 && s.startTime - windowStart < 5000) {
      windowValue += s.value
    } else {
      windowValue = s.value
      windowStart = s.startTime
      curStart = s.startTime
    }
    last = s.startTime
    if (windowValue > cls) {
      cls = windowValue
      worst = { start: curStart, end: s.startTime }
    }
  }
  return { cls, worst }
}

/**
 * 지금까지 쌓인 레이아웃 이동을 읽어 CLS 를 낸다. 캡쳐는 뷰포트 크기를 바꿔 지면을 다시 그리므로 캡쳐 전에 불러야 한다.
 * @param {import('playwright').Page} page
 */
export async function collectLayoutShifts(page) {
  const raw = await page.evaluate(() => {
    const list = globalThis.__adMonitorLayoutShifts__
    if (!Array.isArray(list)) return null
    return { observeFailed: Boolean(list._observeFailed), shifts: list.map((s) => ({ ...s })) }
  })
  if (!raw || raw.observeFailed) return null
  const counted = raw.shifts.filter((s) => !s.hadRecentInput).sort((a, b) => a.startTime - b.startTime)
  const { cls, worst } = computeCls(counted)
  const total = counted.reduce((sum, s) => sum + s.value, 0)
  const adShare = counted.reduce((sum, s) => sum + (s.sources.some((src) => src.adLike) ? s.value : 0), 0)
  const topShifts = [...counted]
    .sort((a, b) => b.value - a.value)
    .slice(0, LAYOUT_SHIFT_TOP_N)
    .map((s) => ({
      value: round(s.value, 4),
      atMs: Math.round(s.startTime),
      inWorstWindow: s.startTime >= worst.start && s.startTime <= worst.end,
      adLike: s.sources.some((src) => src.adLike),
      sources: s.sources,
    }))
  return {
    cls: round(cls, 4),
    totalShift: round(total, 4),
    adLikeShift: round(adShare, 4),
    shiftCount: counted.length,
    worstWindowMs: { start: Math.round(worst.start), end: Math.round(worst.end) },
    topShifts,
  }
}

function round(n, digits) {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/**
 * 광고 서버 주소이거나, 광고 iframe(광고 서버 주소 또는 자사가 아닌 도메인) 안에서 받았으면 광고.
 * 자사 도메인 iframe(댓글 등) 안에서 받은 자사 스크립트는 자사로 둔다.
 */
function classifyScript(url, host, frameChain) {
  if (AD_SCRIPT_URL_RE.test(url)) return 'ad'
  const adFrame = frameChain.some((frameUrl) => {
    const frameHost = hostOf(frameUrl)
    if (!frameHost) return false
    return AD_SCRIPT_URL_RE.test(frameUrl) || !FIRST_PARTY_HOST_RE.test(frameHost)
  })
  if (adFrame) return 'ad'
  return FIRST_PARTY_HOST_RE.test(host) ? 'first' : 'other'
}

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/**
 * script 응답마다 전송 크기(압축된 본문)와 원본 크기를 잰다.
 * Resource Timing 의 transferSize 는 다른 도메인이 Timing-Allow-Origin 을 안 주면 0이라 쓰지 않고, 브라우저가 받은 실제 바이트를 쓴다.
 * @param {import('playwright').Page} page
 */
export function createScriptSizeTracker(page) {
  /** @type {Promise<object | null>[]} */
  const pending = []

  /** @param {import('playwright').Response} response */
  const onResponse = (response) => {
    let request
    try {
      request = response.request()
      if (request.resourceType() !== 'script') return
    } catch {
      return
    }
    const url = response.url()
    if (!/^https?:/i.test(url)) return
    let status = 0
    try {
      status = response.status()
    } catch {
      return
    }
    if (status >= 300 && status < 400) return
    /** 메인 문서 바로 아래 iframe 부터 이 응답을 받은 프레임까지의 주소 */
    const frameChain = []
    try {
      const main = page.mainFrame()
      for (let f = response.frame(); f && f !== main; f = f.parentFrame()) frameChain.unshift(f.url())
    } catch {
      /* 워커 등 프레임이 없는 응답 */
    }
    const work = (async () => {
      const [sizes, body] = await Promise.all([
        request.sizes().catch(() => null),
        response.body().catch(() => null),
      ])
      const decoded = body ? body.length : 0
      // 캐시에서 꺼낸 응답은 본문 크기가 0이나 음수(-헤더 크기)로 온다 — 네트워크로는 받지 않았다
      const cached = Boolean(sizes) && sizes.responseBodySize <= 0 && decoded > 0
      const transfer = sizes
        ? Math.max(0, sizes.responseBodySize)
        : Number(response.headers()['content-length']) || decoded
      return { url, status, frameChain, transfer, decoded, cached }
    })()
    pending.push(Promise.race([work, new Promise((r) => setTimeout(() => r(null), SIZE_WAIT_MS))]).catch(() => null))
  }

  const summarize = async () => {
    const rows = (await Promise.all(pending)).filter(Boolean)
    if (!rows.length) return null

    /** @type {Map<string, any>} */
    const byUrl = new Map()
    for (const r of rows) {
      const host = hostOf(r.url)
      const kind = classifyScript(r.url, host, r.frameChain)
      const key = `${kind} ${r.url}`
      const cur = byUrl.get(key) ?? {
        url: r.url,
        host,
        kind,
        requests: 0,
        cachedRequests: 0,
        transferBytes: 0,
        decodedBytes: 0,
        inIframe: r.frameChain.length > 0,
        ...(r.frameChain.length ? { frameUrl: r.frameChain[0] } : {}),
      }
      cur.requests += 1
      if (r.cached) cur.cachedRequests += 1
      cur.transferBytes += r.transfer
      cur.decodedBytes += r.decoded
      if (r.status >= 400) cur.status = r.status
      byUrl.set(key, cur)
    }
    const scripts = [...byUrl.values()]

    const totals = { requests: 0, transferBytes: 0, decodedBytes: 0 }
    const byKind = { first: { ...totals }, ad: { ...totals }, other: { ...totals } }
    /** @type {Map<string, any>} */
    const byHost = new Map()
    for (const s of scripts) {
      for (const bucket of [totals, byKind[s.kind]]) {
        bucket.requests += s.requests
        bucket.transferBytes += s.transferBytes
        bucket.decodedBytes += s.decodedBytes
      }
      // 같은 도메인이라도 자사 지면용과 광고 iframe 안에서 받은 것은 따로 센다
      const hostKey = `${s.kind} ${s.host}`
      const h = byHost.get(hostKey) ?? { host: s.host, kind: s.kind, requests: 0, transferBytes: 0, decodedBytes: 0 }
      h.requests += s.requests
      h.transferBytes += s.transferBytes
      h.decodedBytes += s.decodedBytes
      byHost.set(hostKey, h)
    }

    const bySize = (a, b) => b.transferBytes - a.transferBytes || b.decodedBytes - a.decodedBytes
    return {
      ...totals,
      uniqueUrls: scripts.length,
      byKind,
      topHosts: [...byHost.values()].sort(bySize).slice(0, HOST_TOP_N),
      hostCount: new Set(scripts.map((x) => x.host)).size,
      cachedRequests: scripts.reduce((n, x) => n + x.cachedRequests, 0),
      largest: scripts.sort(bySize).slice(0, SCRIPT_TOP_N),
    }
  }

  return { onResponse, summarize }
}
