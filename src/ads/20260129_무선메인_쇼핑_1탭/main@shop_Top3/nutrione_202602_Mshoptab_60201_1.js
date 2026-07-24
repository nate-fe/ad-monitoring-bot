(function() {
    // 1. 설정 변수
    var adTitle = "\uB274\uD2B8\uB9AC\uC6D0"; // "뉴트리원"
    
    var currentScript = document.currentScript;
    var adContainer = currentScript.closest('.adloader');
    
    if (!adContainer) {
        console.error("AdLoader: 부모 .adloader 요소를 찾을 수 없습니다.");
        return;
    }

    // 2. 레이아웃 설정
    var layoutConfig = {
        xRow: 5,
        container: { pTop: 8, pRight: 9.5, pBottom: 6, pLeft: 9.5 },
        item: { width: 130, height: 115, pLeft: 3.5, pRight: 3.5 }
    };

    // 3. 스타일 생성 (슬라이딩용 트랜지션 및 다크모드 포함)
    function injectStyles() {
        var c = layoutConfig.container;
        var i = layoutConfig.item;
        
        var itemTotalWidth = (i.width + i.pLeft + i.pRight) * layoutConfig.xRow + (c.pLeft + c.pRight);

        var css = '<style>' +
            '.adloader .pmAd { position:relative; width:100%; margin:0 auto; padding:0; user-select:none; font-family:"Noto Sans KR","돋움",Dotum,Helvetica,sans-serif; letter-spacing:-0.075em; line-height:1.5; background:#ffffff; overflow:hidden; touch-action: pan-y; }' +
            '.adloader .pmAd ul, .adloader .pmAd li { list-style:none; margin:0; padding:0; }' +
            '.adloader .pmAd a { text-decoration:none; color:#222; display:block; position:relative; -webkit-tap-highlight-color: transparent; }' +
            
            /* adtit */
            '.adloader .adtit { text-align:left; position:absolute; top:126px; right:13px; font-size:12px; color:#888; z-index:10; pointer-events: none; }' +
            '.adloader .adtit img { vertical-align:-3px; padding-left:6px; width:23px; height:13px; border:none; }' +
            
            /* mduPhotoList (슬라이딩 대상) */
            '.adloader .mduPhotoList { position:absolute; left:0; top:6px; ' +
            'padding:' + c.pTop + 'px ' + c.pLeft + 'px ' + c.pBottom + 'px ' + c.pLeft + 'px; ' +
            'box-sizing:border-box; width:' + itemTotalWidth + 'px; ' +
            'display: flex; flex-direction: row; ' + /* flex로 가로 정렬 */
            'transform: translate3d(0,0,0); transition: transform 0.1s; cursor: grab; }' +
            
            '.adloader .mduPhotoList:active { cursor: grabbing; }' +
            
            '.adloader .mduPhotoList li { flex: 0 0 auto; width:' + i.width + 'px; height:' + i.height + 'px; padding:0 ' + i.pLeft + 'px 0 ' + i.pRight + 'px; }' +
            
            '.adloader .mduPhotoList li .image { display:block; width:' + i.width + 'px; height:' + i.height + 'px; position:relative; background:#f0f0f0; border-radius: 4px; overflow: hidden; }' +
            '.adloader .mduPhotoList li .image img { border:none; width:100%; height:100%; -webkit-user-drag:none; display:block; object-fit: cover; }' +
            
            '.adloader .mduPhotoList li .image::after { content:""; display:block; position:absolute; top:0; left:0; width:100%; height:100%; border:1px solid #cccccc; box-sizing:border-box; pointer-events:none; border-radius: 4px; }' +
            
            /* 다크 모드 */
            '@media (prefers-color-scheme: dark) {' +
                '.adloader .pmAd { background: #262626; }' +
                '.adloader .pmAd a { color: #e0e0e0; }' +
                '.adloader .adtit { color: #999; }' +
                '.adloader .mduPhotoList li .image { background: #2c2c2c; }' +
                '.adloader .mduPhotoList li .image::after { border-color: #333; }' +
                '.adloader .mduPhotoList li a:hover .image::after { border-color: #666; }' +
            '}' +
            '</style>';

        adContainer.insertAdjacentHTML('afterbegin', css);
    }

    // 4. HTML 구조 생성
    function injectHtml() {
        var itemsHtml = "";
        for (var k = 0; k < layoutConfig.xRow; k++) {
            itemsHtml += 
                '<li data-eq="' + k + '">' +
                    '<a href="#" target="_blank" draggable="false">' +
                        '<div class="image"><img src="" alt="" data-id="' + k + '"></div>' +
                    '</a>' +
                '</li>';
        }

        var html = 
           '<div class="pmAd" style="height:150px;">' +
               '<ul class="mduPhotoList" data-id="0">' + itemsHtml + '</ul>' +
               '<div class="adtit"><span>' + adTitle + '</span><img src="//adimg.nateimg.co.kr/img/ads_icon/ad_icon3.png" alt="광고 아이콘"></div>' +
           '</div>';

        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        while (wrapper.firstChild) {
            adContainer.appendChild(wrapper.firstChild);
        }
    }

    // 5. 슬라이딩 기능 (Vanilla JS)
    function initSlider() {
        var slider = adContainer.querySelector('.mduPhotoList');
        var wrapper = adContainer.querySelector('.pmAd');
        
        var isDragging = false;
        var startPos = 0;
        var currentTranslate = 0;
        var prevTranslate = 0;
        var animationID;
        var startTime = 0;
        
        // 드래그 중 클릭 방지 플래그
        var isClickBlocked = false;

        // 전체 너비 및 경계값 계산
        function getBounds() {
            var containerWidth = wrapper.clientWidth;
            var sliderWidth = slider.scrollWidth;
            // 오른쪽 끝 경계 (음수값)
            var minTranslate = containerWidth - sliderWidth;
            // 내용이 컨테이너보다 작으면 슬라이딩 불필요 (0 고정)
            if (minTranslate > 0) minTranslate = 0;
            return { max: 0, min: minTranslate };
        }

        // 이벤트 리스너 등록
        slider.addEventListener('touchstart', touchStart);
        slider.addEventListener('touchmove', touchMove);
        slider.addEventListener('touchend', touchEnd);
        
        // 마우스 이벤트 (PC 테스트용)
        slider.addEventListener('mousedown', touchStart);
        slider.addEventListener('mouseup', touchEnd);
        slider.addEventListener('mouseleave', function() { if(isDragging) touchEnd(); });
        slider.addEventListener('mousemove', touchMove);

        // 링크 클릭 방지 처리
        var links = slider.querySelectorAll('a');
        links.forEach(function(link) {
            link.addEventListener('click', function(e) {
                if (isClickBlocked) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });

        function touchStart(index) {
            isDragging = true;
            isClickBlocked = false; // 일단 클릭 허용으로 시작
            startTime = new Date().getTime();
            
            var eventX = index.type.includes('mouse') ? index.pageX : index.touches[0].clientX;
            startPos = eventX;
            
            // 드래그 시작 시 애니메이션 제거 (즉각 반응)
            slider.style.transition = 'none';
            
            animationID = requestAnimationFrame(animation);
        }

        function touchMove(index) {
            if (isDragging) {
                var eventX = index.type.includes('mouse') ? index.pageX : index.touches[0].clientX;
                var currentPosition = eventX;
                var diff = currentPosition - startPos;
                
                // 살짝이라도 움직였으면 클릭 방지 활성화
                if (Math.abs(diff) > 5) {
                    isClickBlocked = true;
                }

                currentTranslate = prevTranslate + diff;
            }
        }

        function touchEnd() {
            isDragging = false;
            cancelAnimationFrame(animationID);

            var bounds = getBounds();
            var moved = currentTranslate - prevTranslate;

            // 경계 체크 및 바운스 효과
            if (currentTranslate > bounds.max) {
                currentTranslate = bounds.max; // 왼쪽 벽
            } else if (currentTranslate < bounds.min) {
                currentTranslate = bounds.min; // 오른쪽 벽
            }

            // 드래그 끝났으니 부드럽게 위치 잡기
            slider.style.transition = 'transform 0.3s ease-out';
            setSliderPosition();
            
            prevTranslate = currentTranslate;
        }

        function animation() {
            setSliderPosition();
            if (isDragging) requestAnimationFrame(animation);
        }

        function setSliderPosition() {
            slider.style.transform = 'translate3d(' + currentTranslate + 'px, 0, 0)';
        }
        
        // 리사이즈 시 위치 재조정
        window.addEventListener('resize', function() {
             var bounds = getBounds();
             if (currentTranslate < bounds.min) {
                 currentTranslate = bounds.min;
                 prevTranslate = currentTranslate;
                 slider.style.transition = 'transform 0.3s ease-out';
                 setSliderPosition();
             }
        });
    }

    // 6. 실행 순서
    injectStyles();
    injectHtml();
    initSlider(); // 슬라이더 초기화

    // 7. 데이터 바인딩
    window.ads = window.ads || {};
    
    function prefixUrl(url) {
        if (!url) return "";
        var protocol = window.location.protocol;
        if (/^http[s]?:/.test(protocol)) {
            url = url.replace(/http:/g, protocol).replace(/https:/g, protocol);
        }
        if (/^\/\/\w+?/.test(url)) {
            url = protocol + url;
        }
        return url;
    }

    window.ads.setAds = function(data) {
        if (!data) return;
        var idx = parseInt(data.index);
        if (idx > 0) idx = idx - 1; 

        var targetLi = adContainer.querySelector('li[data-eq="' + idx + '"]');
        if (targetLi && data.img && data.link) {
            var imgEl = targetLi.querySelector('img');
            var aEl = targetLi.querySelector('a');
            if (imgEl) imgEl.src = prefixUrl(data.img);
            if (aEl) aEl.href = prefixUrl(data.link);
        }
    };

    // 8. 외부 스크립트 로드
    var scriptUrls = [
        "https://cyad1.nate.com/js.kti/mnate/stab@cont_a1_Top3",
        "https://cyad1.nate.com/js.kti/mnate/stab@cont_a2_Top3",
        "https://cyad1.nate.com/js.kti/mnate/stab@cont_a3_Top3",
        "https://cyad1.nate.com/js.kti/mnate/stab@cont_a4_Top3",
        "https://cyad1.nate.com/js.kti/mnate/stab@cont_a5_Top3"
    ];

    scriptUrls.forEach(function(src) {
        var script = document.createElement('script');
        script.src = src;
        script.async = true; 
        adContainer.appendChild(script);
    });

})();