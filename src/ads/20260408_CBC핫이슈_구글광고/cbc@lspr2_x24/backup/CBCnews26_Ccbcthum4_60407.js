try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

var img_path  = CyadLib.prefixUrl('https://adimg.nate.com/img/2026/04/cbc/cbc_p13_200x150.jpg');	//이미지 소재 경로
var nate_subMarginCube = {};
nate_subMarginCube.ua = navigator.userAgent.toLowerCase();
nate_subMarginCube.adDivOrgIdL = 'ad_newsMarginCube_right';
nate_subMarginCube.cubeImgSrc  = img_path;
nate_subMarginCube.altText = '광고';
nate_subMarginCube.statUrl1 = encodeURIComponent('');
nate_subMarginCube.statUrl2 = encodeURIComponent('');
nate_subMarginCube.clickLink = encodeURIComponent(location.protocol + '//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#');

nate_subMarginCube.getImage = function () {
    var str = '<a href="//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no%3d%#ads_no%#%26cmp_no%3d%#cmp_no%#%26img_no%3d%#img_no%#" target="_blank">\
    <img src="' + nate_subMarginCube.cubeImgSrc + '" alt="' + nate_subMarginCube.altText + '" style="border-style:none;"/></a>';
    return str;
};

nate_subMarginCube.Init = function () {

    var el;

    if (nate_subMarginCube.ua.indexOf('ipad') !== -1 ||
        nate_subMarginCube.ua.indexOf('iphone') !== -1 ||
        nate_subMarginCube.ua.indexOf('android') !== -1 ||
        nate_subMarginCube.ua.indexOf('chrome') !== -1) {
        el = nate_subMarginCube.getImage();
    } else {
        el = nate_subMarginCube.getImage();
    }

    try {
        var ad_div = parent.document.getElementById(nate_subMarginCube.adDivOrgIdL);
        ad_div.innerHTML = el;
    } catch(e) {

        if(/^http[s]?:\/\/localhost/.test(document.referrer)){
            document.write(el);
        }
    }

};

nate_subMarginCube.Init();