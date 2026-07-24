(function(){
    try {
        var _currentScript = document.currentScript;
        var _adArea = _currentScript.closest('#ad_shbox');
        var _script = document.createElement('script');
        _script.src = 'https://test.mobwithad.com/static/js/mobwith_shopBox_dev.js';
        
        _script.onload = function(){
            var _execScript = document.createElement('script');
            _execScript.textContent = `
            MobWithShopBox(
                { zone: "10889874", width: "320", height: "100", auid:"", adid:"", adType: "banner" }
            );
            `;
            _adArea.appendChild(_execScript);            
        }
        _adArea.appendChild(_script);
    }catch (e) {}
})();