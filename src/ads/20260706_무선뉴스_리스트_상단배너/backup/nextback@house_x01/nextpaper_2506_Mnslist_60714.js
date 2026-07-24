(function () {
        try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

        var bgcolor   = '#fcf0f0';
        var img_path  = CyadLib.prefixUrl('http://adimg.nate.com/img/2019/05/house17/house17_b_0515_640x200_fcf0f0.jpg');	//이미지 소재 경로
        var click_path  = CyadLib.prefixUrl('http://cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#');
        var ad_height   = '100'; //광고 높이 값
        var alt_text    = '광고';
        var adsEl       = '<a href="' + click_path + '" style="display:block;height:' + ad_height + 'px;background:' + bgcolor + '" target="_blank" ><img alt="' + alt_text + '" src="' + img_path + '" width="320" height="'+ ad_height +'" border="0"></a>';
        var ad_id       = 'ad_snb'; // snb 광고

        if( self === top ) {
            var target = document.getElementById(ad_id);
            target.style.backgroundColor = bgcolor;
            target.innerHTML = adsEl;
        } else {
            document.body.style.background = bgcolor;
            document.write(adsEl);

            var iframe = parent.document.getElementById(ad_id).querySelector('iframe');
            iframe.height = ad_height;
        }
    })()