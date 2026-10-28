(function() {
  try {
    var PASSBACK_SRC = '//cyad1.nate.com/html.kti/mnate/google@house_x10';
    var BASE_HEIGHT = 250;
    var FALLBACK_MS = 4000;

    var container = document.getElementById('top_main_banner');
    if (!container) return;

    var css =
      // 판정 전: 250px 고정 + 넘치는 부분 잘라냄 (ins는 렌더링되되 안 보이게)
      '#top_main_banner.ad-pending{height:' + BASE_HEIGHT + 'px;overflow:hidden;}' +
      '#top_main_banner.ad-pending ins.adsbygoogle{visibility:hidden;}' +
      '#passbackIframe{display:block;border:0;width:100%;height:' + BASE_HEIGHT + 'px;}' +
      'ins.adsbygoogle[data-ad-status="unfilled"],' +
      'ins.adsbygoogle.is-empty{display:none !important;}';
    var $style = document.createElement('style');
    $style.type = 'text/css';
    if ($style.styleSheet) { $style.styleSheet.cssText = css; }
    else { $style.appendChild(document.createTextNode(css)); }
    document.head.appendChild($style);

    var lastHeight = -1;
    function setFrameHeight(h) {
      if (h <= 0 || h === lastHeight) return;
      lastHeight = h;
      try {
        if (window.frameElement) {
          window.frameElement.style.height = h + 'px';
        } else {
          window.parent.document.querySelector('iframe[name="' + window.name + '"]').style.height = h + 'px';
        }
      } catch (e) {}
    }

    // [핵심] 시작하자마자 250px로 잠금 → 처음에 커졌다 줄어드는 현상 제거
    container.classList.add('ad-pending');
    setFrameHeight(BASE_HEIGHT);

    var $ins = document.createElement('ins');
    $ins.className = 'adsbygoogle';
    $ins.style.display = 'block';
    $ins.setAttribute('data-ad-format', 'fluid');
    $ins.setAttribute('data-ad-layout-key', '+2t+rl+2h-1m-4u');
    $ins.setAttribute('data-ad-client', 'ca-pub-8710503230568572');
    $ins.setAttribute('data-ad-slot', '5238995569');

    var $passback = null;
    var resizeObserver = null;

    function showPassback() {
      if (!$ins.classList.contains('is-empty')) $ins.classList.add('is-empty');
      if (!$passback) {
        $passback = document.createElement('iframe');
        $passback.id = 'passbackIframe';
        $passback.width = '100%';
        $passback.height = BASE_HEIGHT;
        $passback.style.height = BASE_HEIGHT + 'px';
        $passback.setAttribute('frameborder', 0);
        $passback.setAttribute('scrolling', 'no');
        $passback.setAttribute('allowtransparency', true);
        $passback.src = PASSBACK_SRC;
        container.insertBefore($passback, $ins.nextSibling);
      }
      // 이미 250px이므로 높이 변화 없음. 잠금은 유지해도 무방
      setFrameHeight(BASE_HEIGHT);
    }

    function showAd() {
      if ($ins.classList.contains('is-empty')) $ins.classList.remove('is-empty');
      if ($passback) {
        $passback.parentNode && $passback.parentNode.removeChild($passback);
        $passback = null;
      }
      // filled 확정 시에만 잠금 해제 → 실제 광고 높이로
      container.classList.remove('ad-pending');
      setFrameHeight($ins.offsetHeight);

      // fluid 광고는 렌더 후 높이가 바뀔 수 있으므로 추적
      if (!resizeObserver && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(function() {
          setFrameHeight($ins.offsetHeight);
        });
        resizeObserver.observe($ins);
      }
    }

    function getState() {
      var adStatus = $ins.getAttribute('data-ad-status');
      if (adStatus === 'filled' || adStatus === 'unfilled') return adStatus;
      if ($ins.getAttribute('data-adsbygoogle-status') === 'done' &&
          !$ins.querySelector('iframe')) {
        return 'unfilled';
      }
      return 'pending';
    }

    function update(force) {
      var state = getState();
      if (state === 'pending' && force) state = 'unfilled';
      if (state === 'unfilled') showPassback();
      else if (state === 'filled') showAd();
      // pending이면 아무것도 안 함 → 250px 잠금 유지
    }

    var $script = document.createElement('script');
    $script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8710503230568572';
    $script.async = true;
    $script.crossOrigin = 'anonymous';
    $script.onload = function() {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}

      var observer = new MutationObserver(function() { update(false); });
      observer.observe($ins, {
        attributes: true,
        attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'],
        childList: true,
        subtree: true
      });

      setTimeout(function() { update(false); }, 1000);
      setTimeout(function() { update(true); }, FALLBACK_MS);
    };
    $script.onerror = function() { showPassback(); };

    container.appendChild($ins);
    container.appendChild($script);
  } catch (err) { console.warn(err); }
})();