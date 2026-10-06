/**
 * 미리보기 문서마다 맨 앞에 넣는 스텁. 문자열로 들고 있다가 인라인 <script> 로 넣는다.
 * - 콘솔·오류를 앱으로 보낸다 (postMessage)
 * - 외부 script 는 type="text/x-sim" 으로 바꿔 받아오지 않고 onload 만 흉내 낸다
 * - iframe src 는 자리 표시 srcdoc 으로 바꾼다
 * - adsbygoogle 은 가짜 구현: push 마다 ins 하나를 처리하고 data-ad-status 를 붙인다
 */
export const SIM_STUB = String.raw`function (win, frameLabel, opts) {
  var doc = win.document;
  function post(type, data) {
    try {
      var msg = { __adSim: opts.run, type: type, frame: frameLabel };
      for (var k in data) msg[k] = data[k];
      win.top.postMessage(msg, '*');
    } catch (e) {}
  }
  function fmt(a) {
    try {
      if (a && typeof a === 'object' && 'message' in a && 'name' in a) return a.name + ': ' + a.message;
      if (a && typeof a === 'object' && a.nodeType === 1) return '<' + a.tagName.toLowerCase() + '>';
      if (typeof a === 'object') return JSON.stringify(a);
    } catch (e) {}
    return String(a);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (lv) {
    var orig = win.console[lv];
    win.console[lv] = function () {
      var text = Array.prototype.slice.call(arguments).map(fmt).join(' ');
      post('console', { level: lv, text: text });
      if (orig) orig.apply(win.console, arguments);
    };
  });
  function listen() {
    win.addEventListener('error', function (e) {
      post('console', { level: 'error', text: 'Uncaught ' + (e.error ? fmt(e.error) : e.message) });
    });
    win.addEventListener('unhandledrejection', function (e) {
      post('console', { level: 'error', text: 'Unhandled rejection: ' + fmt(e.reason) });
    });
    win.document.addEventListener('securitypolicyviolation', function (e) {
      post('sim', { text: '외부 요청 차단(미리보기): ' + e.blockedURI });
    });
  }
  listen();
  // document.open() 은 리스너를 지우므로 다시 단다 (원본 태그 격리 실행)
  var DP = win.Document.prototype;
  var origOpen = DP.open;
  var origWrite = DP.write;
  DP.open = function () {
    var r = origOpen.apply(this, arguments);
    if (this === win.document) listen();
    return r;
  };
  DP.write = function (html) {
    if (this === win.document) {
      post('sim', { text: 'document.write ' + String(html).length + '자' });
      String(html).replace(/<script[^>]*\ssrc=["']?([^"'\s>]+)/gi, function (_m, src) {
        post('sim', { text: '외부 스크립트 받아오지 않음(CSP): ' + src });
        return _m;
      });
    }
    return origWrite.apply(this, arguments);
  };

  function placeholder(url, el) {
    var w = el.getAttribute('width') || parseInt(el.style.width, 10) || '?';
    var h = el.getAttribute('height') || parseInt(el.style.height, 10) || '?';
    return '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%}' +
      'body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-sizing:border-box;' +
      'padding:6px;border:1px dashed #7c88ff;font:12px/1.35 sans-serif;color:#2b3266;text-align:center;overflow:hidden;' +
      'word-break:break-all;background:repeating-linear-gradient(45deg,#eef1ff,#eef1ff 8px,#e2e7ff 8px,#e2e7ff 16px)}' +
      'small{color:#5a628f}</style><b>iframe 광고 자리</b><span>' + esc(w) + ' × ' + esc(h) + '</span><small>' + esc(url) + '</small>';
  }

  function prep(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.tagName === 'SCRIPT' && el.getAttribute('src')) {
      var src = el.getAttribute('src');
      el.type = 'text/x-sim';
      post('sim', { text: '외부 스크립트 받아오지 않음: ' + src });
      win.setTimeout(function () {
        post('sim', { text: 'onload 흉내: ' + src });
        el.dispatchEvent(new win.Event('load'));
      }, 150);
    } else if (el.tagName === 'IFRAME' && el.getAttribute('src')) {
      var url = el.getAttribute('src');
      el.removeAttribute('src');
      el.srcdoc = placeholder(url, el);
      post('sim', { text: 'iframe src를 자리 표시로 바꿈: ' + url });
    }
  }
  function after(el) {
    if (!el || el.nodeType !== 1 || el.tagName !== 'IFRAME' || el.hasAttribute('srcdoc')) return;
    try {
      // 격리 실행용 안쪽 문서는 결과(done)를 보내지 않는다
      install(el.contentWindow, frameLabel + ' › iframe', { run: opts.run, fill: opts.fill });
    } catch (e) {}
  }
  var NP = win.Node.prototype;
  var origAppend = NP.appendChild;
  var origInsert = NP.insertBefore;
  NP.appendChild = function (child) {
    prep(child);
    var r = origAppend.call(this, child);
    after(child);
    return r;
  };
  NP.insertBefore = function (child, ref) {
    prep(child);
    var r = origInsert.call(this, child, ref);
    after(child);
    return r;
  };

  function fill(ins) {
    var width = ins.offsetWidth;
    if (!width) {
      post('console', {
        level: 'error',
        text: 'TagError: adsbygoogle.push() error: No slot size for availableWidth=0',
      });
      return;
    }
    win.setTimeout(function () {
      var fixed = !ins.getAttribute('data-ad-format') && !ins.getAttribute('data-ad-layout');
      if (opts.fill) {
        var height = fixed
          ? parseInt(ins.style.height, 10) || 250
          : ins.getAttribute('data-ad-layout') === 'in-article'
            ? 280
            : ins.getAttribute('data-ad-format') === 'fluid'
              ? 120
              : 250;
        if (!fixed) ins.style.height = height + 'px';
        var box = doc.createElement('div');
        box.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:' + height +
          'px;box-sizing:border-box;border:1px dashed #22a35a;font:12px/1.35 sans-serif;color:#185c35;' +
          'background:repeating-linear-gradient(45deg,#e9f9ef,#e9f9ef 8px,#dcf3e5 8px,#dcf3e5 16px)';
        box.innerHTML = '<b>애드센스 광고 (filled)</b><span>' + width + ' × ' + height + '</span>';
        origAppend.call(ins, box);
        ins.setAttribute('data-ad-status', 'filled');
        post('sim', { text: 'adsbygoogle 응답: data-ad-status="filled" (' + width + '×' + height + ')' });
      } else {
        ins.setAttribute('data-ad-status', 'unfilled');
        post('sim', { text: 'adsbygoogle 응답: data-ad-status="unfilled"' });
      }
    }, 400);
  }
  win.adsbygoogle = {
    loaded: true,
    push: function () {
      var list = doc.querySelectorAll('ins.adsbygoogle');
      var ins = null;
      for (var i = 0; i < list.length; i++) {
        if (!list[i].getAttribute('data-adsbygoogle-status')) {
          ins = list[i];
          break;
        }
      }
      if (!ins) {
        post('console', {
          level: 'error',
          text: "TagError: adsbygoogle.push() error: All 'ins' elements in the DOM with class=adsbygoogle already have ads in them.",
        });
        return;
      }
      ins.setAttribute('data-adsbygoogle-status', 'done');
      post('sim', { text: 'adsbygoogle.push() → ins 처리 시작' });
      win.setTimeout(function () {
        fill(ins);
      }, 60);
    },
  };

  // 지연 로드: 탭이 백그라운드면 IntersectionObserver 가 돌지 않으므로, 바로 화면에 들어온 것으로 친다
  win.IntersectionObserver = function (callback) {
    var self = this;
    var stopped = false;
    this.observe = function (target) {
      win.setTimeout(function () {
        if (stopped) return;
        post('sim', { text: '지연 로드: 광고 영역이 화면에 들어온 것으로 처리' });
        callback([{ isIntersecting: true, intersectionRatio: 1, target: target }], self);
      }, 50);
    };
    this.unobserve = function () {};
    this.disconnect = function () {
      stopped = true;
    };
    this.takeRecords = function () {
      return [];
    };
  };

  if (opts.watch) {
    var seen = {};
    new win.MutationObserver(function (list) {
      list.forEach(function (m) {
        var el = m.target;
        if (!el.hasAttribute || !el.hasAttribute('data-sim-watch')) return;
        var label = el.getAttribute('data-sim-watch');
        var h = el.style.height || (el.getAttribute('height') ? el.getAttribute('height') + 'px' : '');
        if (!h || seen[label] === h) return;
        seen[label] = h;
        post('sim', { text: label + ' 높이 → ' + h });
      });
    }).observe(doc.documentElement, { attributes: true, subtree: true, attributeFilter: ['style', 'height'] });
  }

  if (opts.adDoc) {
    // 응답 흉내(push 후 약 0.5초)까지 끝난 뒤 결과를 보낸다
    win.setTimeout(function () {
      // 생성 코드와 같은 방법으로 광고 위치를 찾아 그 안에 무언가 들어갔는지 본다
      var slot = opts.area ? doc.querySelector(opts.area) : doc.querySelector('[data-sim-slot]');
      var rendered = false;
      if (slot) {
        for (var i = 0; i < slot.children.length; i++) {
          var child = slot.children[i];
          if (child.tagName !== 'SCRIPT' && !child.hasAttribute('data-sim-slot')) rendered = true;
        }
      }
      post('done', { rendered: rendered });
    }, 1500);
  }
}`

/** 스텁을 문서 안에서 바로 실행하는 인라인 script 내용 */
export function stubScript(label: string, opts: Record<string, unknown>): string {
  const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
  return `(function () { var install = ${SIM_STUB}; install(window, ${json(label)}, ${json(opts)}); })();`
}
