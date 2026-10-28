(function() {
  try {
    var $css = `
      #passbackIframe { display: none; }
      ins.is-empty div[id*="aswift"], ins.is-empty iframe:not(#passbackIframe) { display: none !important; height: 0 !important; }
      ins.is-empty #passbackIframe { display: block !important; height: 250px !important; }
      ins:not(.is-empty) #passbackIframe { display: none !important; }
    `;
    var $style = document.createElement('style'); 
    $style.type = 'text/css';
    if ($style.styleSheet) { $style.styleSheet.cssText = $css; } 
    else { $style.appendChild(document.createTextNode($css)); }
    document.head.appendChild($style);
  
    var $passback = document.createElement('iframe');
    $passback.src = '//cyad1.nate.com/html.kti/mnate/google@house_x10';
    $passback.width = '100%';
    $passback.height = 250;
    $passback.id = 'passbackIframe';
    $passback.setAttribute('frameborder', 0);
    $passback.setAttribute('scrolling', 'no');
    $passback.setAttribute('allowtransparency', true);

    function updateIframeHeight() {
      var $ins = document.querySelector('ins.adsbygoogle');
      if (!$ins) return;

      var status = $ins.getAttribute('data-adsbygoogle-status');
      if (status === 'done') {
        var hostDiv = $ins.querySelector('div[id*="aswift"]');
        var hasAdContent = hostDiv && hostDiv.getElementsByTagName('iframe').length > 0;
        
        var finalHeight = 0;
        var needsEmptyClass = !hasAdContent;

        // [수정] 클래스가 이미 설정되어 있다면 중복 변경하지 않음 (무한루프 방지)
        if (needsEmptyClass && !$ins.classList.contains('is-empty')) {
          $ins.classList.add('is-empty');
        } else if (!needsEmptyClass && $ins.classList.contains('is-empty')) {
          $ins.classList.remove('is-empty');
        }

        if (needsEmptyClass) {
          finalHeight = 250;
        } else {
          finalHeight = $ins.offsetHeight;
        }

        if (finalHeight > 0) {
          try {
            if (window.frameElement) {
              window.frameElement.style.height = finalHeight + 'px';
            } else {
              window.parent.document.querySelector('iframe[name=' + window.name + ']').style.height = finalHeight + 'px';
            }
          } catch(e) {}
        }
        
        // [추가] 광고 로드가 완전히 끝났고 높이 조절까지 끝났다면 감시 중단 (선택 사항)
        // observer.disconnect(); 
      }
    }
  
    var $ins = document.createElement('ins');
    $ins.className = 'adsbygoogle';
    $ins.style.display = 'block';
    $ins.setAttribute('data-ad-format', 'fluid');
    $ins.setAttribute('data-ad-layout-key', '+2t+rl+2h-1m-4u');
    $ins.setAttribute('data-ad-client', 'ca-pub-8710503230568572');
    $ins.setAttribute('data-ad-slot', '1167393771');

    var $script = document.createElement('script');
    $script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8710503230568572';
    $script.async = true;
    $script.crossOrigin = 'anonymous';
    $script.onload = function() {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      $ins.appendChild($passback);
  
      // [수정] 감시 범위를 좁히고 중복 방지 로직 적용
      var observer = new MutationObserver(function(mutations) {
        // 무한 루프 방지를 위해 로직 실행 전 체크하거나 디바운스 처리 가능
        updateIframeHeight();
      });
      
      observer.observe($ins, { attributes: true, childList: true });

      setTimeout(updateIframeHeight, 1000);
      setTimeout(updateIframeHeight, 3000);
    };
  
    var container = document.getElementById('top_main_banner');
    if (container) {
        container.appendChild($ins);
        container.appendChild($script);
    }

  } catch(err) { console.warn(err); }
})();