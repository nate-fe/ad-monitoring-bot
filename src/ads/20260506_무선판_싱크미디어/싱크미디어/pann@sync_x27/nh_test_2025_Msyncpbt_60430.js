(function() {
    const CONFIG = {
        width: 320,
        height: 100,
        companyUid: 'e72c2e8fceab76ba6c10396712572cf930a6b84e',
        adUrl: 'https://ad.3dpop.kr/web_ad/?company_uid='
    };

    const currentScript = document.currentScript;
    if (!currentScript) return;

    const iframe = document.createElement('iframe');
    Object.assign(iframe, {
        src: `${CONFIG.adUrl}${CONFIG.companyUid}&position=center&isCloseBtn=N`,
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
    container.style.height = CONFIG.height + 'px';
    container.appendChild(iframe);

    currentScript.parentNode.insertBefore(container, currentScript);
})();