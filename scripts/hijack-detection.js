/**
 * 강제 리다이렉트·뒤로가기 가로채기 탐지.
 *
 * 1) 강제 리다이렉트: 측정 중 사용자가 아무것도 누르지 않았는데 메인 프레임이 다른 문서로 넘어가려 하거나
 *    새 창(팝업)이 뜨는 경우. 메인 프레임 이동은 CDP Fetch 로 **막고** 기록한다 — 그대로 두면 광고 랜딩
 *    페이지에서 광고칸을 재고 캡쳐하게 되어 리포트 전체가 엉뚱한 페이지 기준이 된다.
 * 2) 뒤로가기 가로채기: 사용자 조작 없이 history 에 항목을 쌓거나(pushState·hash 변경) popstate 를 붙잡아,
 *    뒤로가기를 눌러도 페이지를 못 떠나게 하거나 광고로 보내는 경우. 페이지 안 후킹으로 호출 위치를 남기고,
 *    측정 마지막에 실제로 뒤로가기를 한 번 눌러 결과를 본다.
 */

/** 같은 출처에서 무한 반복으로 시도하는 경우를 대비한 기록 상한 */
const MAX_REDIRECT_RECORDS = 30

/**
 * 모든 프레임에 네비게이션 전에 심는다. 기록만 하고 원래 동작은 그대로 실행한다.
 * location.href 대입·location.replace 는 브라우저가 재정의를 막아 두어(unforgeable) 여기서 못 잡는다 —
 * 그쪽은 CDP 네비게이션 요청의 initiator 스택으로 출처를 찾는다.
 */
export const HIJACK_CAPTURE_SCRIPT = `
(() => {
  const KEY = '__adMonitorHijack__';
  if (globalThis[KEY]) return;
  const MAX = 50;
  const store = { history: [], listeners: [], opens: [], hashChanges: [] };
  Object.defineProperty(globalThis, KEY, { value: store, configurable: false, enumerable: false, writable: false });

  /** 이 후킹 코드 자신은 http 출처가 없으므로, 스택의 첫 http 프레임이 곧 호출한 스크립트다 */
  const where = () => {
    try {
      for (const line of String(new Error().stack || '').split('\\n')) {
        const m = line.match(/\\(?(https?:\\/\\/[^\\s)]+):(\\d+):(\\d+)\\)?\\s*$/);
        if (m) return { sourceUrl: m[1], line: Number(m[2]), column: Number(m[3]) };
      }
    } catch {}
    return {};
  };
  const userActivated = () => {
    try { return Boolean(navigator.userActivation && navigator.userActivation.hasBeenActive); } catch { return undefined; }
  };
  const record = (list, item) => {
    try {
      if (list.length >= MAX) return;
      list.push({ atMs: Math.round(performance.now()), pageUrl: location.href, userActivated: userActivated(), ...item, ...where() });
    } catch {}
  };
  const noHash = (u) => String(u).split('#')[0];

  for (const method of ['pushState', 'replaceState']) {
    const original = History.prototype[method];
    if (typeof original !== 'function') continue;
    History.prototype[method] = function (state, title, url) {
      try {
        const before = location.href;
        let target = before;
        if (url != null) { try { target = new URL(String(url), before).href; } catch {} }
        record(store.history, { method, url: target, sameDocumentUrl: noHash(target) === noHash(before) });
      } catch {}
      return original.apply(this, arguments);
    };
  }

  const WATCHED = ['popstate', 'hashchange', 'beforeunload'];
  const originalAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    try {
      if (this === globalThis && WATCHED.includes(String(type))) {
        record(store.listeners, { type: String(type), via: 'addEventListener' });
      }
    } catch {}
    return originalAdd.call(this, type, listener, options);
  };
  for (const type of WATCHED) {
    const prop = 'on' + type;
    try {
      const d = Object.getOwnPropertyDescriptor(globalThis, prop) || Object.getOwnPropertyDescriptor(Window.prototype, prop);
      if (!d || !d.set || !d.get || !d.configurable) continue;
      Object.defineProperty(globalThis, prop, {
        configurable: true,
        enumerable: d.enumerable,
        get() { return d.get.call(this); },
        set(v) {
          if (typeof v === 'function') record(store.listeners, { type, via: prop });
          d.set.call(this, v);
        },
      });
    } catch {}
  }

  // location.hash 대입도 history 항목을 하나 늘린다(pushState 로는 hashchange 가 안 뜬다)
  try {
    originalAdd.call(globalThis, 'hashchange', (e) => {
      if (store.hashChanges.length < MAX) {
        store.hashChanges.push({ atMs: Math.round(performance.now()), from: e.oldURL, to: e.newURL, userActivated: userActivated() });
      }
    });
  } catch {}

  const originalOpen = globalThis.open;
  if (typeof originalOpen === 'function') {
    globalThis.open = function (url) {
      record(store.opens, { url: url == null ? '' : String(url) });
      return originalOpen.apply(this, arguments);
    };
  }
})();
`

/** CDP initiator 스택(부모 async 스택 포함)에서 첫 http(s) 프레임 */
function firstHttpFrame(stack) {
  let cur = stack
  for (let guard = 0; cur && guard < 20; guard += 1) {
    for (const f of cur.callFrames ?? []) {
      if (typeof f.url === 'string' && /^https?:\/\//i.test(f.url)) {
        return {
          sourceUrl: f.url,
          line: Number.isFinite(f.lineNumber) ? f.lineNumber + 1 : undefined,
          column: Number.isFinite(f.columnNumber) ? f.columnNumber + 1 : undefined,
        }
      }
    }
    cur = cur.parent
  }
  return undefined
}

function initiatorLocation(initiator) {
  if (!initiator) return {}
  const fromStack = firstHttpFrame(initiator.stack)
  if (fromStack) return fromStack
  if (typeof initiator.url === 'string' && /^https?:\/\//i.test(initiator.url)) {
    return {
      sourceUrl: initiator.url,
      ...(Number.isFinite(initiator.lineNumber) ? { line: initiator.lineNumber + 1 } : {}),
    }
  }
  return {}
}

/**
 * 메인 프레임 이동을 감시한다. 첫 문서 요청(과 그 서버 리다이렉트)은 통과시키고, 그 뒤의 메인 프레임 문서
 * 요청은 전부 ERR_ABORTED 로 막는다. ERR_ABORTED 는 오류 페이지를 띄우지 않아 지금 페이지가 그대로 남는다.
 *
 * 반드시 page.goto 전에 불러야 한다. 실패하면(CDP 미지원 등) null 을 돌려주고 측정은 그대로 진행한다.
 */
export async function installRedirectGuard(context, page) {
  /** @type {import('playwright').CDPSession} */
  let session
  try {
    session = await context.newCDPSession(page)
    await session.send('Page.enable')
    await session.send('Network.enable')
  } catch (err) {
    console.warn(`[hijack] 감시 설치 실패: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }

  let mainFrameId = ''
  try {
    const { frameTree } = await session.send('Page.getFrameTree')
    mainFrameId = frameTree.frame.id
  } catch {
    /* 아래 Fetch 이벤트의 frameId 로 대신 판정할 수 없으니 감시를 포기 */
  }
  if (!mainFrameId) {
    await session.detach().catch(() => {})
    return null
  }

  /** Network requestId → initiator. Fetch 일시정지와 도착 순서가 보장되지 않아 나중에 합친다 */
  const initiatorByRequestId = new Map()
  /** Page.frameRequestedNavigation 의 reason(scriptInitiated·metaTagRefresh·anchorClick 등), URL 기준 */
  const reasonByUrl = new Map()
  /** 처음 연 문서의 Network requestId — 서버 리다이렉트도 같은 id 로 이어진다 */
  let initialNetworkId = ''
  /** @type {{ kind: 'navigation' | 'popup', url: string, at: string, reason?: string, networkId?: string, blocked: boolean, count: number }[]} */
  const attempts = []

  const remember = (entry) => {
    const prev = attempts.find((a) => a.kind === entry.kind && a.url === entry.url)
    if (prev) {
      prev.count += 1
      return
    }
    if (attempts.length < MAX_REDIRECT_RECORDS) attempts.push({ ...entry, count: 1 })
  }

  session.on('Network.requestWillBeSent', (e) => {
    if (e.type !== 'Document' || e.frameId !== mainFrameId) return
    if (e.initiator && !initiatorByRequestId.has(e.requestId)) initiatorByRequestId.set(e.requestId, e.initiator)
  })
  session.on('Page.frameRequestedNavigation', (e) => {
    if (e.frameId !== mainFrameId) return
    reasonByUrl.set(e.url, e.reason)
  })

  session.on('Fetch.requestPaused', async (e) => {
    const pass = () => session.send('Fetch.continueRequest', { requestId: e.requestId }).catch(() => {})
    try {
      if (e.frameId !== mainFrameId || e.resourceType !== 'Document') return void (await pass())
      const networkId = e.networkId ?? ''
      if (!initialNetworkId || networkId === initialNetworkId) {
        initialNetworkId ||= networkId
        return void (await pass())
      }
      remember({
        kind: 'navigation',
        url: e.request.url,
        at: new Date().toISOString(),
        networkId,
        blocked: true,
      })
      await session.send('Fetch.failRequest', { requestId: e.requestId, errorReason: 'Aborted' }).catch(pass)
    } catch {
      await pass()
    }
  })

  try {
    await session.send('Fetch.enable', {
      patterns: [{ urlPattern: '*', resourceType: 'Document', requestStage: 'Request' }],
    })
  } catch (err) {
    console.warn(`[hijack] 메인 프레임 이동 차단 불가(기록만 함): ${err instanceof Error ? err.message : String(err)}`)
  }

  /** 새 창은 막을 수 없으니 기록 후 바로 닫는다(남겨 두면 그쪽 광고까지 돌며 측정을 방해한다) */
  page.on('popup', (popup) => {
    let url = ''
    try {
      url = popup.url()
    } catch {
      /* ignore */
    }
    remember({ kind: 'popup', url, at: new Date().toISOString(), blocked: false })
    popup.close().catch(() => {})
  })

  return {
    /** 지금까지 기록된 이동 시도 수(같은 URL 반복 포함) */
    attemptCount: () => attempts.reduce((n, a) => n + a.count, 0),
    /** initiator·reason 을 붙여 리포트용으로 정리 */
    redirects: () =>
      attempts.map(({ networkId, ...a }) => {
        const reason = a.reason ?? reasonByUrl.get(a.url)
        return {
          ...a,
          ...(reason ? { reason } : {}),
          ...(networkId ? initiatorLocation(initiatorByRequestId.get(networkId)) : {}),
        }
      }),
    dispose: async () => {
      await session.send('Fetch.disable').catch(() => {})
      await session.detach().catch(() => {})
    },
  }
}

/** 모든 프레임의 후킹 기록을 모은다. 교차 출처 광고 iframe 도 Playwright 는 들어갈 수 있다 */
export async function collectHijackHooks(page) {
  const merged = { history: [], listeners: [], opens: [], hashChanges: [] }
  for (const frame of page.frames()) {
    const isMain = frame === page.mainFrame()
    let data = null
    try {
      data = await frame.evaluate(() => globalThis.__adMonitorHijack__ ?? null)
    } catch {
      continue // 이미 떨어져 나간 프레임
    }
    if (!data) continue
    for (const key of Object.keys(merged)) {
      for (const item of data[key] ?? []) merged[key].push({ ...item, frame: isMain ? 'main' : 'iframe' })
    }
  }
  return merged
}

/**
 * 뒤로가기를 실제로 한 번 눌러 본다. 측정이 끝난 뒤에만 불러야 한다(페이지 상태가 바뀔 수 있다).
 *
 * 크롬 데스크톱은 사용자 조작 없이 쌓인 항목을 뒤로가기 버튼에서 건너뛰지만, 인앱 웹뷰·일부 모바일 브라우저는
 * 그렇지 않아 실제 사용자가 갇힌다. CDP 뒤로가기는 건너뛰지 않으므로 「쌓인 항목이 있으면 갇힌다」로 본다.
 */
export async function runBackButtonTest(page, guard, { waitMs = 2000 } = {}) {
  let before
  try {
    // 문서가 바뀌면 사라지는 표식 — URL 비교로는 pushState 로 주소만 바꾼 같은 문서를 구분할 수 없다
    before = await page.evaluate(() => {
      globalThis.__adMonitorBackMarker__ = true
      return { url: location.href, historyLength: history.length }
    })
  } catch {
    return null
  }
  const attemptsBefore = guard?.attemptCount() ?? 0
  if (before.historyLength <= 1) {
    return { historyLength: before.historyLength, wentBack: false, stayedOnPage: false, triggeredRedirect: false }
  }
  try {
    await page.goBack({ timeout: 5000, waitUntil: 'commit' })
  } catch {
    /* 같은 문서 안 이동은 응답이 없어 시간 초과로 끝나기도 한다 */
  }
  await page.waitForTimeout(waitMs)
  let after = { url: '', sameDocument: false }
  try {
    after = await page.evaluate(() => ({ url: location.href, sameDocument: globalThis.__adMonitorBackMarker__ === true }))
  } catch {
    /* ignore */
  }
  return {
    historyLength: before.historyLength,
    wentBack: true,
    urlBefore: before.url,
    urlAfter: after.url,
    /** 뒤로가기를 눌렀는데 같은 문서에 그대로 있음 = 사용자가 페이지를 못 떠난다 */
    stayedOnPage: after.sameDocument,
    /** 뒤로가기를 누르자 다른 곳으로 보내려 함(위 감시가 막은 시도) */
    triggeredRedirect: (guard?.attemptCount() ?? 0) > attemptsBefore,
  }
}

/**
 * 리포트용 요약. 판정 근거를 reasons 에 남긴다.
 * - 강제 리다이렉트: 측정 중 막은 메인 프레임 이동 + 뜬 팝업
 * - 뒤로가기 가로채기: 뒤로가기 시험에서 광고로 보내거나 페이지에 갇힘, 또는 history 를 쌓으면서 popstate 를 붙잡음
 */
export function summarizeHijack({ redirects, hooks, backTest, pageUrl }) {
  const noHash = (u) => String(u ?? '').split('#')[0]
  // 같은 주소로 다시 여는 것(메타 리프레시 등 지면 자체 새로고침)은 기록만 하고 강제 이동으로 세지 않는다
  const resolve = (u, base) => {
    try {
      return new URL(u, base).href
    } catch {
      return String(u ?? '')
    }
  }
  const marked = redirects.map((r) => {
    if (r.kind === 'navigation' && pageUrl && noHash(r.url) === noHash(pageUrl)) return { ...r, selfReload: true }
    // 팝업 이벤트에는 호출 위치가 없다 — 같은 주소로 부른 window.open 기록에서 가져온다
    if (r.kind === 'popup' && !r.sourceUrl) {
      const open = hooks.opens.find((o) => o.sourceUrl && resolve(o.url, o.pageUrl) === r.url)
      if (open) return { ...r, sourceUrl: open.sourceUrl, line: open.line, column: open.column }
    }
    return r
  })
  const forcedRedirectCount = marked.filter((r) => !r.selfReload).length
  const pushes = hooks.history.filter((h) => h.method === 'pushState')
  const popstateListeners = hooks.listeners.filter((l) => l.type === 'popstate' || l.type === 'hashchange')
  const reasons = []

  if (backTest?.triggeredRedirect) reasons.push('뒤로가기를 누르자 다른 페이지로 이동을 시도함')
  if (backTest?.stayedOnPage) reasons.push('뒤로가기를 눌러도 페이지를 떠나지 못함')
  const stacked = pushes.length + hooks.hashChanges.length
  if (stacked > 0 && popstateListeners.length > 0) {
    reasons.push(`사용자 조작 없이 history 를 ${stacked}번 쌓고 popstate/hashchange 를 가로챔`)
  }

  return {
    forcedRedirectCount,
    redirects: marked,
    backHijack: {
      suspected: reasons.length > 0,
      reasons,
      ...(backTest ? { backTest } : {}),
      historyCalls: hooks.history,
      listeners: hooks.listeners,
      hashChanges: hooks.hashChanges,
    },
    windowOpens: hooks.opens,
  }
}
