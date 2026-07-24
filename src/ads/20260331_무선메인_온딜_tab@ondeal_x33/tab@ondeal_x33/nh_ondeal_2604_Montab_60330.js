try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

(function () {
  var img_path  = CyadLib.prefixUrl('https://adimg.nate.com/img/2026/03/test/test_ondeal_0330_620x892.jpg');
  var alt_text    = '\uAD11\uACE0'; // 광고를 unicode로 작성
  var _currentScript = document.currentScript;
  var _div = document.createElement('div');
  var _parent = _currentScript.parentNode;
  var _imgTag = document.createElement('img');

  _imgTag.setAttribute('alt', alt_text);
  _imgTag.setAttribute('src', img_path);
  _imgTag.setAttribute('width', '100%');
  
  var _aTag = document.createElement('a');
  _aTag.setAttribute('href', '//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#');
  _aTag.setAttribute('target', '_top');
  _aTag.style.display = 'block';

  _aTag.appendChild(_imgTag);

  _div.appendChild(_aTag);
  _parent.insertBefore(_div, _currentScript);
})();