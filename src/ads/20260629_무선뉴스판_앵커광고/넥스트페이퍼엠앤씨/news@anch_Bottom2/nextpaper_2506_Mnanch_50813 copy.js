(function () {
    try {
        var _head = document.querySelector('head');

        // 1. gpt.js 로더 스크립트
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _script.async = true;
        _head.appendChild(_script);

        // 2. 설정 로직을 텍스트로 담은 인라인 스크립트
        var _inline = document.createElement('script');
        _inline.innerHTML = [
            "window.googletag = window.googletag || { cmd: [] };",
            "googletag.cmd.push(function () {",
            "    var _anchFlag = false;",
            "    var _ANCHOR_INS_ID = 'gpt_unit_/21682743634,22664242840/nate/nate_mo_news_anchor_1x1_0';",
            "    googletag.pubads().set('page_url', '//nate.com');",
            "    googletag.setConfig({ singleRequest: true });",
            "    var anchorSlot = googletag.defineOutOfPageSlot('/21682743634,22664242840/nate/nate_mo_news_anchor_1x1', googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR);",
            "    if (anchorSlot) {",
            "        anchorSlot.setConfig({ targeting: { ad_type: 'anchor' } }).addService(googletag.pubads());",
            "        googletag.enableServices();",
            "        var _getAnchorEl = function () {",
            "            return document.getElementById(_ANCHOR_INS_ID) || document.querySelector('[data-anchor-status]');",
            "        };",
            "        // GPT가 #GoTop에 꽂는 transform 무력화 (none으로 덮음)",
            "        var _killTransform = function () {",
            "            var _goTop = document.getElementById('GoTop');",
            "            if (_goTop && _goTop.style.transform && _goTop.style.transform !== 'none') _goTop.style.transform = 'none';",
            "        };",
            "        // GoTop 위치: 노출이면 (ins 높이 + 20px), 아니면 20px",
            "        var _setGoTop = function (show) {",
            "            var _goTop = document.getElementById('GoTop');",
            "            if (!_goTop) return;",
            "            if (show) {",
            "                var _ins = _getAnchorEl();",
            "                var _h = _ins ? _ins.offsetHeight : 0;",
            "                _goTop.style.bottom = (_h + 20) + 'px';",
            "            } else {",
            "                _goTop.style.bottom = '20px';",
            "            }",
            "        };",
            "        // 광고 소재가 채워지면 높이 반영",
            "        googletag.pubads().addEventListener('slotRenderEnded', function (e) {",
            "            if (e.slot === anchorSlot) _setGoTop(!e.isEmpty);",
            "        });",
            "        // ad_snb가 float를 잃는 순간 앵커 노출",
            "        var _watch = function () {",
            "            var _snb = document.getElementById('ad_snb');",
            "            if (!_snb) return;",
            "            var _hadFloat = _snb.classList.contains('float');",
            "            var _observer = new MutationObserver(function () {",
            "                var _hasFloat = _snb.classList.contains('float');",
            "                if (!_anchFlag && _hadFloat && !_hasFloat) {",
            "                    _anchFlag = true;",
            "                    googletag.display(anchorSlot);",
            "                    _observer.disconnect();",
            "                }",
            "                _hadFloat = _hasFloat;",
            "            });",
            "            _observer.observe(_snb, { attributes: true, attributeFilter: ['class'] });",
            "        };",
            "        // displayed→(높이+20) / dismissed·요소없음→20px / 중간→유지",
            "        var _applyGoTop = function () {",
            "            var _el = _getAnchorEl();",
            "            var _status = _el ? _el.getAttribute('data-anchor-status') : null;",
            "            if (_status === 'displayed') _setGoTop(true);",
            "            else if (_status === 'dismissed') _setGoTop(false);",
            "            else if (!_el) _setGoTop(false);",
            "            // _el 있고 status null/중간 → 유지",
            "        };",
            "        var _goTopWatch = function () {",
            "            _applyGoTop();",
            "            // 앵커 상태 감시 (앵커가 <body> 밖에 붙어도 잡히도록 documentElement)",
            "            var _obs = new MutationObserver(_applyGoTop);",
            "            _obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-anchor-status'] });",
            "            // #GoTop의 transform 변화 감시 → GPT가 넣으면 즉시 none",
            "            var _goTop = document.getElementById('GoTop');",
            "            if (_goTop) {",
            "                _killTransform();",
            "                var _tObs = new MutationObserver(_killTransform);",
            "                _tObs.observe(_goTop, { attributes: true, attributeFilter: ['style'] });",
            "            }",
            "        };",
            "        if (document.readyState === 'loading') {",
            "            document.addEventListener('DOMContentLoaded', function () { _watch(); _goTopWatch(); });",
            "        } else {",
            "            _watch();",
            "            _goTopWatch();",
            "        }",
            "    }",
            "});"
        ].join('\n');
        _head.appendChild(_inline);
    } catch (err) {
        console.log(err);
    }
})();