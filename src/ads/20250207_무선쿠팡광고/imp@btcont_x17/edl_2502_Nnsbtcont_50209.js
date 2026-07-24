// 애즈명 : edl_2502_Nnsbtcont_50209
// 광고코드 : <script src="https://cp.edl.co.kr/cou/api_reco.php?code=900natem280x280&adid=&type=js&click_log=&click_type="></script>
; (function () {
    var adWidth = 288;
    var adHeight = 288;
    // top level iframe
    try {
        var __parent = parent.parent.document.querySelector('#AdIbl');
        if (__parent) {
            __parent.width = adWidth;
            __parent.height = adHeight;
            __parent.style.width = adWidth + 'px';
            __parent.style.height = adHeight + 'px';
        }
    } catch (err) {
        window.onload = function () {
            console.log(window.parent.document.getElementById('AdIbl'))
            window.parent.postMessage({
                "method": "fnct",
                "name": "callCrossOriginAd",
                "property": { target: 'AdIbl', width: adWidth, height: adHeight }
            }, '*');
        }
    }


    ; (function () {
        document.write('<script src="https://cp.edl.co.kr/cou/api_reco.php?code=900natem280x280&adid=&type=js&click_log=&click_type="></script>')
    })()
})()


    ; (function () {
        var adWidth = 250;
        var adHeight = 250;
        // top level iframe
        try {
            var __parent = parent.parent.document.querySelector('#AdIbl');
            if (__parent) {
                __parent.width = adWidth;
                __parent.height = adHeight;
                __parent.style.width = adWidth + 'px';
                __parent.style.height = adHeight + 'px';
            }

        } catch (err) {
        }


        ; (function () {
            document.write('<script src="https://cp.edl.co.kr/cou/api_reco.php?code=900natem280x280&adid=&type=js&click_log=&click_type="></script>')
        })()
    })()