(function() {
    var _wrapper = document.createElement('div');
    var _currentScript = document.currentScript; 
    var _parent = _currentScript.parentNode;

    _wrapper.classList.add('taboola-wrapper');

    // 1. 다크모드 대응 및 기본 스타일 CSS 추가
    var $custom_style = document.createElement('style');
    $custom_style.innerHTML = `
        .taboola-wrapper {
            background-color: transparent;
        }
        /* hr 태그 초기에는 숨김 처리 */
        .taboola-wrapper + hr.componentDivision {
            display: none;
        }
        /* 광고가 로드되어 'show-hr' 클래스가 붙으면 표시 */
        .taboola-wrapper.show-hr + hr.componentDivision {
            display: block;
        }

        .taboola-wrapper .tbl-feed-card {
            margin-bottom: 0 !important;
            box-shadow: none !important;
        }

        @media (prefers-color-scheme: dark) {
            .taboola-wrapper {
                background-color: #262626;
            }
            .taboola-wrapper .trc_rbox_header, 
            .taboola-wrapper .trc_rbox_container .video-title,
            .taboola-wrapper .trc_rbox_container .trc_item_title {
                color: #e1e1e1 !important;
            }
            .taboola-wrapper .trc_rbox_container .trc_item_description {
                color: #b0b0b0 !important;
            }
            .taboola-wrapper .trc_rbox_container .trc_item_source {
                color: #888 !important;
            }
        }
    `;
    document.head.appendChild($custom_style);

    // 2. 타불라 헤더 스크립트 로드
    var $head_code = `
  window._taboola = window._taboola || [];
  _taboola.push({article:'auto'});
  !function (e, f, u, i) {
    if (!document.getElementById(i)){
      e.async = 1;
      e.src = u;
      e.id = i;
      f.parentNode.insertBefore(e, f);
    }
  }(document.createElement('script'),
  document.getElementsByTagName('script')[0],
  '//cdn.taboola.com/libtrc/nate-mobile/loader.js',
  'tb_loader_script');
  if(window.performance && typeof window.performance.mark == 'function')
    {window.performance.mark('tbl_ic');}

    `;
    
    var $head_script = document.createElement('script');
    $head_script.type = 'text/javascript';
    $head_script.innerHTML = $head_code;
    document.head.appendChild($head_script);

    // 3. 광고 컨테이너 생성
    var _div = document.createElement('div');
    _div.id = 'taboola-mobile-below-article-thumbnails';
    _wrapper.appendChild(_div);
    
    // 4. 광고 실행 및 플러시 스크립트
    var $el_script = document.createElement('script');
    $el_script.type = 'text/javascript';
    $el_script.innerHTML = `
        var ua = navigator.userAgent || '';
        var isNateApp = /ref:nate_app/i.test(ua);

        window._taboola = window._taboola || [];

        var pushObj = {
        mode: 'alternating-thumbnails-textunder-2x2',
        container: 'taboola-mobile-below-article-thumbnails',
        placement: 'Mobile Below Article Thumbnails',
        target_type: 'mix'
        };

        if (!isNateApp) {
        pushObj.cseg = 'indirect';
        }

        _taboola.push(pushObj);
    `;

    var $body_script = document.createElement('script');
    $body_script.type = 'text/javascript';
    $body_script.innerHTML = `window._taboola = window._taboola || []; _taboola.push({flush: true});`;

    // 5. 구분선(hr) 생성 및 DOM 삽입
    var _hr = document.createElement('hr');
    _hr.classList.add('componentDivision');

    _wrapper.appendChild($el_script);
    document.body.appendChild($body_script);
    
    // 구조: [wrapper] -> [hr] 순서로 배치
    _parent.insertBefore(_hr, _currentScript);
    _parent.insertBefore(_wrapper, _hr);

    // 6. 감시자(MutationObserver) 설정: 광고 로드 시점에 hr 보여주기
    var observer = new MutationObserver(function(mutations) {
        // _div 내부에 무언가(광고 컨텐츠)가 추가되었는지 확인
        if (_div.children.length > 0) {
            _wrapper.classList.add('show-hr'); // CSS를 통해 hr을 노출시킴
            observer.disconnect(); // 한번 노출되면 감시 종료
        }
    });

    // _div 내부의 자식 요소 변화를 감시
    observer.observe(_div, { childList: true, subtree: true });

})();