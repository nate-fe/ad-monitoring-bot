(function () {
        try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

        var ad_height   = '150'; //광고 높이 값
        var bgcolor     = '#c9f5ff';
        var img_path    = CyadLib.prefixUrl('https://adimg.nate.com/img/2026/02/nutri03/nutri03_0226_640x300_c9f5ff.jpg');	//이미지 소재 경로
        var click_path  = CyadLib.prefixUrl('http://cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#'); //랜딩
        var alt_text    = '광고';
        var ad_id       = '#ad_big'; //상단

        var adsEl = '<a href="' + click_path + '" style="display:block;height:' + ad_height + 'px;background:' + bgcolor + '" target="_top" ><img alt="' + alt_text + '" src="' + img_path + '" width="320" height="'+ ad_height +'" border="0"></a>';

        if( self === top ) {
            var ad_container = document.querySelectorAll(ad_id);
            ad_container.forEach(v => {
                v.style.backgroundColor = bgcolor;
                v.innerHTML = adsEl;
                v.style.height = ad_height + 'px';
            })
        } else {
            document.body.style.background = bgcolor;
            document.write(adsEl);

            var ifm_wrap = parent.document.querySelectorAll(ad_id);
            ifm_wrap.forEach(v => {
                var ifm = v.querySelector('iframe');
                if(ifm) {
                    ifm.height = ad_height;
                }
            });
        }
    })()