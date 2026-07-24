(function() {
    var _body = document.querySelectorAll('body')[0];
    var _div = document.createElement('div');
    _div.setAttribute('id', 'wp_adr_area');
    _body.appendChild(_div);
    
    function sampleAsyncLoadScript(scriptUrl, callback) { 
        try { 
            var js = document.createElement('script'); 
            js.onload = function() { 
                if (typeof callback === 'function') { callback(); } 
            }; 
            js.src = scriptUrl; 
            var d = document.getElementsByTagName('script')[0]; 
            d.appendChild(js); 
        } catch(e) {} 
    } 
    
    sampleAsyncLoadScript('https://cdn-aitg.widerplanet.com/js/adr.js', function() { 
        WiderPlanetAdRenderer.writeAd({ 
            type : "iframe",  // “script” type 은 지원하지 않습니다. 
            width : "100%", 
            height : "150", 
            zoneid : "24158", 
            adElementId: 'wp_adr_area' // 상단 광고가 랜더링 될 DOM Element와 같은 ID 
        }); 
    }); 
})();