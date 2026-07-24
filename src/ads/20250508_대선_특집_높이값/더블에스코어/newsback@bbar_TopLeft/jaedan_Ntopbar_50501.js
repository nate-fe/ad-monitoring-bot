try { if (!CyadLib) var CyadLib = {}; CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function (t) { var r = location.protocol; return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)), /^\/\/\w+?/.test(t) && (t = r + t), /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")), t }) } catch (t) { }

var protocol = location.protocol;
var nate_news = {};
nate_news.ua = navigator.userAgent.toLowerCase();
nate_news.adDivOrgId2 = 'ad_sponsorObj';
nate_news.flashSrc = ''; //플래시소재
nate_news.imageSrc = CyadLib.prefixUrl('https://adimg.nate.com/img/2024/11/merryyear1201/merryyear1201_1129_970x120.jpg');	//이미지 소재 경로
nate_news.statUrl1 = encodeURIComponent('');
nate_news.statUrl2 = encodeURIComponent('');
nate_news.clickLink1 = encodeURIComponent(protocol + '//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no%3d%#ads_no%#%26cmp_no%3d%#cmp_no%#%26img_no%3d%#img_no%#');

var ad_div;

nate_news.init = function () {
    if (nate_news.flashSrc !== '') {
        nate_news.makeFlash();
    }
    else {
        nate_news.makeImage();
    }
};

nate_news.makeImage = function () {
    var el = '<a href="//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no%3d%#ads_no%#%26cmp_no%3d%#cmp_no%#%26img_no%3d%#img_no%#" onClick="ADStatTraffic();" target="_blank">\
    <img src="'+ nate_news.imageSrc + '" style="border-style:none;" alt="광고"/></a>';
    document.write(el);
}

nate_news.makeFlash = function () {
    document.write(nate_news.getEmbedHTML(nate_news.flashSrc, 970, 120, 'click_url=' + nate_news.clickLink1 + '&stat_url1=' + nate_news.statUrl1));
}

nate_news.getEmbedHTML = function (s, w, h, p) {
    var str = '';
    str += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,124,0" width="' + w + '" height="' + h + '" id="nate_news_banner" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="' + s + '" /><param name="quality" value="high" /><param name="wmode" value="transparent" /><param name="bgcolor" value="#ffffff" />';
    if (p != null) str += '<param name="flashvars" value="' + p + '" />';
    str += '<embed src="' + s + '" quality="high" wmode="transparent" bgcolor="#ffffff" width="' + w + '" height="' + h + '" name="nate_news_banner" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer"';
    if (p != null) str += ' flashvars="' + p + '"';
    str += ' /></object>';
    return str;
};

//레퍼러
function ADStatTraffic() {
    var referrerUrl = "ad.nate.com/nate/pann/tpbar/";
    var referrerParam = "ad01";
    var tempImage = new Image(),
        ref = '';
    if ('referrer' in document) {
        ref = document.referrer.replace('http://', '').replace('https://', '');
    }
    tempImage.src = '//statetc.nate.com/stat/stat.tiff?cp_url=[' + referrerUrl + '??ndru3=' + getCookie('UD3') + '&ndrl3=' + getCookie('ndrn') + '&ndrparam1=' + referrerParam + '&ndrparam4=' + ref + ']';

}

function getCookie(key) {
    var i, x, y, cks = document.cookie.split(';');
    key = (key) ? key : 'AD';
    for (i = 0; i < cks.length; i++) {
        x = cks[i].substr(0, cks[i].indexOf('='));
        y = cks[i].substr(cks[i].indexOf('=') + 1);
        x = x.replace(/^\s+|\s+$/g, '');
        if (x === key) {
            return unescape(y);
        }
    }
}

try {
    ad_div = parent.document.getElementById(nate_news.adDivOrgId2);
    ad_div.style.display = 'none';
} catch (e) { }

if (nate_news.ua.indexOf('chrome') !== -1) {
    nate_news.makeImage();
} else {
    nate_news.init();
}

try {
    parent.parent.document.querySelector('#adDiv iframe').style.height = '120px'
} catch (e) {
    window.onload = function () {
        window.top.postMessage({
            "method": "fnct",
            "name": "callCrossOriginAd",
            "property": { target: 'ad02IFrame', height: 120 }
        }, '*');
    }
}