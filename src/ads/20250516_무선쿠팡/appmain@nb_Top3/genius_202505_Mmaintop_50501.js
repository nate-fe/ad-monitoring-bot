(function () {
    try {
        var pass_url = !!ad_type && ad_type === 'app' ? 'appmain@nb_Top3?exception_ads=235465' : 'main@nb_Top3?exception_ads=235465';
        var ad_container = document.querySelectorAll('#ad_big');
        ad_container.forEach(v => {
            var ad_script = document.createElement('script');
            ad_script.src = '//ads.shople.kr/js/sk_doc_write.js?app_code=RgNaAybdxh&tsource=www.nate.com&width=100%&height=150&dom_id=ad_big';
            ad_script.onerror = function () {
                var replace_script = document.createElement('script');
                replace_script.src = '//cyad1.nate.com/js.kti/mnate/' + pass_url;
                v.appendChild(replace_script);
                throw new Error('network ad error');
            }
            ad_script.onload = function () {
                v.style.maxHeight = '150px';
            }
            v.appendChild(ad_script);
        });
    } catch (err) { console.warn(err); }
})();