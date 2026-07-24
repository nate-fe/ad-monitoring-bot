(function () {
    var $ad_view = document.getElementById('ad_innerView');

    // DOM에서 다 그려진 후에 작동
    function loadScriptInAd() {
        const hasVideo = document.body.querySelector('video') !== null;

        let activeSlots = 0; // 활성 슬롯 수 추적
        const totalSlots = 2; // 전체 슬롯 수

        window.googletag = window.googletag || { cmd: [] };

        // 빈 슬롯 제거 함수
        function removeEmptySlot(slotId, adItemId) {
            const adItem = document.getElementById(adItemId);
            if (adItem) {
                adItem.remove();
                console.log(`빈 슬롯 제거됨: ${slotId}`);
            }

            // 활성 슬롯 수 감소
            activeSlots--;

            // 모든 슬롯이 비어있으면 전체 컨테이너 숨김
            if (activeSlots === 0) {
                const container = document.getElementById('ad-row-container');
                if (container) {
                    container.style.display = 'none';
                    console.log('모든 광고가 비어있어 컨테이너를 숨김');
                }
            }
        }

        googletag.cmd.push(function () {
            const pubadscom = googletag.pubads().set('page_url', '//nate.com');

            if (hasVideo) {
                // 비디오가 있는 경우 두 번째 광고 아이템 제거
                const adItem2 = document.getElementById('ad-item-2');
                if (adItem2) {
                    adItem2.remove();
                }

                // 첫 번째 광고만 정의
                const slot1 = googletag.defineSlot(
                    '/21682743634,22664242840/S003/nate_mo_ap_bottom00_300x250',
                    [300, 250],
                    'S003_nate_mo_ap_bottom00_300x250'
                ).addService(pubadscom);

                pubadscom.enableSingleRequest();
                googletag.enableServices();

                // 초기 활성 슬롯 수 설정 (비디오가 있을 때는 1개)
                activeSlots = 1;

                // 첫 번째 광고만 표시
                googletag.display('S003_nate_mo_ap_bottom00_300x250');
            } else {
                // 슬롯 정의
                const slot1 = googletag.defineSlot(
                    '/21682743634,22664242840/S003/nate_mo_ap_bottom00_300x250',
                    [300, 250],
                    'S003_nate_mo_ap_bottom00_300x250'
                ).addService(pubadscom);

                const slot2 = googletag.defineSlot(
                    '/21622890900,22664242840/KR_nate.com_pc_article_avs',
                    [[300, 250], [1, 1]],
                    'div-gpt-ad-1747382446854-0'
                )
                    .defineSizeMapping(
                        googletag.sizeMapping()
                            .addSize([728, 300], [[1, 1], [300, 250]])
                            .addSize([0, 0], [])
                            .build()
                    )
                    .setCollapseEmptyDiv(true)
                    .addService(pubadscom);

                pubadscom.enableSingleRequest();
                googletag.enableServices();

                // 초기 활성 슬롯 수 설정
                activeSlots = totalSlots;

                // 광고 표시
                googletag.display('S003_nate_mo_ap_bottom00_300x250');
                googletag.display('div-gpt-ad-1747382446854-0');
            }

            // 렌더링 완료 이벤트 리스너
            googletag.pubads().addEventListener('slotRenderEnded', function (event) {
                const slotId = event.slot.getSlotElementId();
                const isEmpty = event.isEmpty;

                // 빈 슬롯 처리
                if (isEmpty) {
                    if (slotId === 'S003_nate_mo_ap_bottom00_300x250') {
                        removeEmptySlot(slotId, 'ad-item-1');
                    } else if (slotId === 'div-gpt-ad-1747382446854-0') {
                        removeEmptySlot(slotId, 'ad-item-2');
                    }
                }
            });
        });
    }

    if ($ad_view) {
        try {
            var _adContainerContent = document.createElement('div');
            var _style = document.createElement('style');
            var _css = ` 
            .ad-container-content{ /* background-color:#E6E6E6; */ } .ad-row { display: flex; justify-content: center; gap: 10px; } .ad-slot { min-width: 300px; min-height: 250px; position: relative; align-content: center;} .ad-item { min-width: 300px; min-height: 250px; position: relative; border: 1px solid rgb(0, 0, 0,0.2); background-color: rgb(0, 0, 0); } .ad-label { border: 1px solid rgb(0, 0, 0,0.2); width:28px; height:18px; position: absolute; top: 0; left: 0; background-color: rgb(0, 0, 0,0.5); color: #ffffff; font-size: 12px; font-weight: bold; padding: 0; z-index: 10; text-align: center; }
            `;
            var _lib = document.createElement('script');
            var _adRow = document.createElement('div');
            _adContainerContent.classList.add('ad-container-content');
            _style.appendChild(document.createTextNode(_css));
            _lib.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
            _lib.async = true;
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
                    _adSlot.setAttribute('id', 'div-gpt-ad-1747382446854-0');
                }
                _adItem.appendChild(_adLabel);
                _adItem.appendChild(_adSlot);
                _adRow.appendChild(_adItem);
            }
            _adContainerContent.appendChild(_style);
            _adContainerContent.appendChild(_lib);
            _adContainerContent.appendChild(_adRow);
            $ad_view.appendChild(_adContainerContent);
            // DOM에 그린 후 함수 호출
            loadScriptInAd();

        } catch (err) { console.warn(err) }
    }
})();
