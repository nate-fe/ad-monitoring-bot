(function() {
    const CONFIG = {
        width: 320,
        height: 100,
        companyUid: 'e72c2e8fceab76ba6c10396712572cf930a6b84e',
        targetId: 'ad_big',
        adUrl: 'https://ad.3dpop.kr/web_ad/?company_uid='
    };

    const currentScript = document.currentScript;
    if (!currentScript) return;

    const iframe = document.createElement('iframe');
    Object.assign(iframe, {
        src: `${CONFIG.adUrl}${CONFIG.companyUid}`,
        width: CONFIG.width,
        height: CONFIG.height,
        scrolling: 'no',
        frameBorder: '0'
    });
    
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';

    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.style.marginBottom = '10px';
    container.appendChild(iframe);

    currentScript.parentNode.insertBefore(container, currentScript);

    const resizeParent = () => {
        try {
            // 직접 접근 시도 (동일 도메인일 경우)
            const parentAdBox = window.parent.document.getElementById(CONFIG.targetId);
            if (parentAdBox) {
                parentAdBox.style.height = `${CONFIG.height}px`;
            }
        } catch (e) {
            // 크로스 도메인일 경우 postMessage 전달
            const url = location.href;
            const parentWindow = window.parent;

            if (url.includes('news')) {
                parentWindow.postMessage({
                    method: "fnct",
                    name: "callCrossOriginAd",
                    property: { target: window.name, height: CONFIG.height }
                }, '*');
            } else if (url.includes('pann')) {
                parentWindow.postMessage({
                    target: CONFIG.targetId,
                    params: { height: CONFIG.height }
                }, '*');
            }
        }
    };

    // window.onload 대신 addEventListener 사용 (기존 스크립트 충돌 방지)
    if (document.readyState === 'complete') {
        resizeParent();
    } else {
        window.addEventListener('load', resizeParent);
    }
})();