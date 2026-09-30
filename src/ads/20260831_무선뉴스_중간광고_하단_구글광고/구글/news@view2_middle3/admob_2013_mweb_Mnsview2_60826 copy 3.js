(function () {
  var $view = document.getElementById('ad_innerView2');
  if (!$view) return;

  var MAX_H = 350;
  var FIXED = false;   // true → auto 포맷으로 350px 요청(잘림 없음)
                       // false → fluid 유지 + 350px 클램프(잘릴 수 있음)

  var style = document.createElement('style');
  style.appendChild(document.createTextNode([
    '#ad_innerView2{position:relative;box-sizing:border-box;',
      'width:auto;padding:0;text-align:center;',
      'height:auto;max-height:' + MAX_H + 'px;overflow:hidden;}',
    '#ad_innerView2 ins.adsbygoogle{display:block !important;',
      'max-width:100% !important;max-height:' + MAX_H + 'px !important;}',
    '#ad_innerView2 ins.adsbygoogle iframe{',
      'max-width:100% !important;max-height:' + MAX_H + 'px !important;}',
    '#ad_innerView2 ins.adsbygoogle[data-ad-status="unfilled"]{display:none !important;}',
    '#ad_innerView2.is-unfilled{display:none !important;margin:0 !important;}',
    '.ad_inner_view_box2{position:absolute;top:0;left:0;width:28px;height:18px;',
      'border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.5);',
      'font-size:12px;font-weight:500;color:#fff !important;',
      'line-height:18px !important;z-index:1;}'
  ].join('')));
  $view.appendChild(style);

  var ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.setAttribute('data-ad-client', 'ca-pub-8710503230568572');
  ins.setAttribute('data-ad-slot', '4149426708');
  ins.setAttribute('data-full-width-responsive', 'false');

  if (FIXED) {
    ins.setAttribute('data-ad-format', 'auto');
    ins.style.setProperty('height', MAX_H + 'px', 'important');
  } else {
    ins.setAttribute('data-ad-format', 'fluid');
    ins.setAttribute('data-ad-layout', 'in-article');
  }
  $view.appendChild(ins);

  var badge = document.createElement('div');
  badge.className = 'ad_inner_view_box2';
  badge.textContent = 'AD';
  $view.appendChild(badge);

  function fit() {
    if (ins.getAttribute('data-ad-status') === 'unfilled') {
      $view.classList.add('is-unfilled');
      return;
    }
    $view.classList.remove('is-unfilled');

    var w = $view.clientWidth;
    if (!w) return;

    [ins].concat([].slice.call(
      ins.querySelectorAll('div[id^="aswift_"], iframe')
    )).forEach(function (el) {
      if (el.style.width !== w + 'px') {
        el.style.setProperty('width', w + 'px', 'important');
        el.style.setProperty('max-width', w + 'px', 'important');
      }
      // 높이 클램프: 350px을 넘길 때만 개입
      var h = el.offsetHeight;
      if (h > MAX_H && el.style.height !== MAX_H + 'px') {
        el.style.setProperty('height', MAX_H + 'px', 'important');
        el.style.setProperty('max-height', MAX_H + 'px', 'important');
      }
    });
  }

  var s = document.createElement('script');
  s.async = true;
  s.setAttribute('crossorigin', 'anonymous');
  s.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8710503230568572';
  s.onload = function () {
    fit();
    (window.adsbygoogle = window.adsbygoogle || []).push({});

    if (window.MutationObserver) {
      var mo = new MutationObserver(fit);
      mo.observe(ins, {
        childList: true, subtree: true,
        attributes: true,
        attributeFilter: ['style', 'width', 'height', 'data-ad-status']
      });
      setTimeout(function () { mo.disconnect(); }, 10000);
    }
    window.addEventListener('resize', fit);
  };
  $view.appendChild(s);
})();