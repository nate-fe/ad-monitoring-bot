(function () {
  try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

  var bgcolor     = '#ffea3d';
  var img_path    = CyadLib.prefixUrl('https://adimg.nate.com/img/2025/04/cp/cp_a_0421_640x400_ffea3d.png');	//이미지 소재 경로
  var click_path   = CyadLib.prefixUrl('http://cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#');
  var alt_text    = '광고';
  var _adArea = document.getElementById('main_banner');
  var _imgTag = document.createElement('img');

  _imgTag.setAttribute('alt', alt_text);
  _imgTag.setAttribute('src', img_path);
  _imgTag.setAttribute('width', 320);
  _imgTag.setAttribute('height', 200);
  
  var _aTag = document.createElement('a');
  _aTag.setAttribute('href', click_path);
  _aTag.setAttribute('target', '_top');
  _aTag.style.display = 'block';
  _aTag.style.background = bgcolor;

  _aTag.appendChild(_imgTag);  
  
  try {
    parent.document.getElementById('ad_big').height = 200;
    parent.document.getElementById('ad_big').style.height = '200px';
  } catch(e) {
    window.onload = function() {
      var isNews = location.href.indexOf('news') > -1;
      var isPann = location.href.indexOf('pann') > -1;
      if(isNews) {
        window.parent.postMessage({
          "method": "fnct",
          "name": "callCrossOriginAd",
          "property": {target: window.name, height: 200}
        }, '*');
      }
      if(isPann) {
        window.parent.postMessage({
          target: 'ad_big',
          params: {
            height: 200
          }
        }, '*');
      }
    }
  }
  _adArea.appendChild(_aTag);
})();