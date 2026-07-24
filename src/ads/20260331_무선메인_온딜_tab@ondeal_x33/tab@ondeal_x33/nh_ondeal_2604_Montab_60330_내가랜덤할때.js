try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

(function () {
    var adsArr = [
        {
            ads_no: 240993,
        }, {
            ads_no: 240404,
        }
    ]
  var alt_text    = '\uAD11\uACE0'; // 광고를 unicode로 작성
  var _currentScript = document.currentScript;
  var _div = document.createElement('div');
  var _parent = _currentScript.parentNode;
  var _imgTag = document.createElement('img');

  var _randomId = Math.floor(Math.random() * 2)  
  
  _imgTag.setAttribute('alt', alt_text);
  _imgTag.setAttribute('src', CyadLib.prefixUrl('https://cyad1.nate.com/image.kti/mnate/ht@ht_s_x32?ads_no='+adsArr[_randomId].ads_no));
  _imgTag.setAttribute('width', '100%');
  
  var _aTag = document.createElement('a');
  _aTag.setAttribute('href', CyadLib.prefixUrl('https://cyad1.nate.com/click.kti/mnate/ht@ht_x32?ads_no=')+adsArr[_randomId].ads_no);
  _aTag.setAttribute('target', '_top');
  _aTag.style.display = 'block';

  _aTag.appendChild(_imgTag);

  _div.appendChild(_aTag);
  _parent.insertBefore(_div, _currentScript);
})();