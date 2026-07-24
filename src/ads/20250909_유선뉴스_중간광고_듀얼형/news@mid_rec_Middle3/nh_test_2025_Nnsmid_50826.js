(function () {
    var $ad_view = document.getElementById('ad_innerView');

    // DOM에서 다 그려진 후에 작동
    function loadScriptInAd() {
        const hasVideo = document.body.querySelector('video') !== null;

        let activeSlots = 0;
        const totalSlots = 2;

        window.googletag = window.googletag || { cmd: [] };

        function removeEmptySlot(slotId, adItemId) {
            const adItem = document.getElementById(adItemId);
            if (adItem) {
                adItem.remove();
                console.log(`빈 슬롯 제거됨: ${slotId}`);
            }
            activeSlots--;
            if (activeSlots === 0) {
                const container = document.getElementById('ad-row-container');
                if (container) {
                    container.style.display = 'none';
                    console.log('모든 광고가 비어있어 컨테이너를 숨김');
                }
            }
        }

        googletag.cmd.push(function () {
            const pubads = googletag.pubads().set('page_url', '//nate.com');

            // (선택) 레이지로드 권장
            pubads.enableLazyLoad({
                fetchMarginPercent: 200,
                renderMarginPercent: 100,
                mobileScaling: 2.0
            });

            // 공통: 렌더 이벤트 리스너는 enableServices() 전에 등록해도/후에 등록해도 동작하지만, 일관성 유지
            googletag.pubads().addEventListener('slotRenderEnded', function (event) {
                const slotId = event.slot.getSlotElementId();
                if (event.isEmpty) {
                    if (slotId === 'S003_nate_mo_ap_bottom00_300x250') {
                        removeEmptySlot(slotId, 'ad-item-1');
                    } else if (slotId === 'AnyMindads') {
                        removeEmptySlot(slotId, 'ad-item-2');
                    }
                }
            });

            if (hasVideo) {
                // 비디오가 있을 때는 두 번째 광고 제거
                const adItem2 = document.getElementById('ad-item-2');
                if (adItem2) adItem2.remove();

                googletag.defineSlot(
                    '/21682743634,22664242840/S003/nate_mo_ap_bottom00_300x250',
                    [300, 250],
                    'S003_nate_mo_ap_bottom00_300x250'
                )
                    .setCollapseEmptyDiv(true)
                    .addService(pubads);

                pubads.enableSingleRequest();
                googletag.enableServices();

                activeSlots = 1;
                googletag.display('S003_nate_mo_ap_bottom00_300x250');

            } else {
                // 슬롯1
                googletag.defineSlot(
                    '/21682743634,22664242840/S003/nate_mo_ap_bottom00_300x250',
                    [300, 250],
                    'S003_nate_mo_ap_bottom00_300x250'
                )
                    .setCollapseEmptyDiv(true)
                    .addService(pubads);

                // 슬롯2: ID 일치(중요)
                googletag.defineSlot(
                    '/21622890900,22664242840/KR_nate.com_pc_article_avs',
                    [[300, 250], [1, 1]],
                    'AnyMindads'
                )
                    .defineSizeMapping(
                        googletag.sizeMapping()
                            .addSize([728, 300], [[1, 1], [300, 250]]) // 데스크톱 이상
                            .addSize([0, 0], [])                    // 모바일 미노출
                            .build()
                    )
                    .setCollapseEmptyDiv(true)
                    .addService(pubads);

                pubads.enableSingleRequest();
                googletag.enableServices();

                activeSlots = totalSlots;

                googletag.display('S003_nate_mo_ap_bottom00_300x250');
                googletag.display('AnyMindads');
            }
        });
    }

    if ($ad_view) {
        try {
            var _adContainerContent = document.createElement('div');
            var _style = document.createElement('style');
            var _css = ` 
            .ad-container-content{ /* background-color:#E6E6E6; */ } .ad-row { display:flex; justify-content:center; gap:10px; } .ad-slot { min-width:300px; min-height:250px; position:relative; align-content:center; } .ad-item { min-width:300px; min-height:250px; position:relative; border:1px solid rgba(0,0,0,0.2); background-color:#000; } .ad-label { border:1px solid rgba(0,0,0,0.2); width:28px; height:18px; position:absolute; top:0; left:0; background-color:rgba(0,0,0,0.5); color:#fff; font-size:12px; font-weight:bold; padding:0; z-index:10; text-align:center; line-height:18px; }
            `;
            var _lib = document.createElement('script');
            var _lib2 = document.createElement('script');
            var _adRow = document.createElement('div');
            var _head = document.head || document.getElementsByTagName('head')[0];
            _adContainerContent.classList.add('ad-container-content');
            _style.appendChild(document.createTextNode(_css));
            _lib.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
            _lib.async = true;
            _lib2.src = '//anymind360.com/js/18263/ats.js'
            _lib2.async = true;
            _lib2.type = 'application/javascript';
            _head.appendChild(_style);
            _head.appendChild(_lib);
            _head.appendChild(_lib2);
            _adRow.classList.add('ad-row');
            _adRow.setAttribute('id', 'ad-row-container');
            // 최대 2개의 광고
            for (var i = 1; i < 3; i++) {
                var _adItem = document.createElement('div');
                var _adLabel = document.createElement('div');
                var _adSlot = document.createElement('div');
                _adItem.classList.add('ad-item');
                _adItem.setAttribute('id', 'ad-item-' + i);
                _adLabel.classList.add('ad-label');
                _adLabel.innerText = 'AD';
                _adLabel.style.setProperty('font-size', '12px', 'important');
                _adSlot.classList.add('ad-slot');
                // 첫번째 광고
                if (i === 1) {
                    _adSlot.setAttribute('id', 'S003_nate_mo_ap_bottom00_300x250');
                }
                // 두번째 광고
                else {
                    _adSlot.setAttribute('id', 'AnyMindads');
                }
                _adItem.appendChild(_adLabel);
                _adItem.appendChild(_adSlot);
                _adRow.appendChild(_adItem);
            }
            _adContainerContent.appendChild(_adRow);
            $ad_view.appendChild(_adContainerContent);
            // DOM에 그린 후 함수 호출
            loadScriptInAd();

        } catch (err) { console.warn(err) }
    }
})();
