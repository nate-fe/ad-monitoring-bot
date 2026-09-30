//loginout setting 2018-05-30 02:21
try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

var loginAds = {
    clickUrl : CyadLib.prefixUrl('http://cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#') // 클릭경로
    ,imgUrl: CyadLib.prefixUrl('https://adimg.nate.com/img/2025/05/hecto/hecto_a_0526_420x205.png') // 이미지 경로
};
var _currentScript = document.currentScript;
var _parentDiv = _currentScript.parentElement;
var _aTag = document.createElement('a');
_aTag.href = loginAds.clickUrl;
_aTag.target = '_blank';
_aTag.innerHTML = '<img src="' + loginAds.imgUrl + '" style="width:100%;" border="0" alt="광고">';
_parentDiv.appendChild(_aTag);