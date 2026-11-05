(function () {
  var _adWidth = 320;
  var _adHeight = 250;
  var _protocol = location.protocol === 'http:' ? 'http:' : 'https:';
  var googleAlternateAdUrl = _protocol + '//cyad1.nate.com/html.kti/mnate/google@house_x13';

  var $ad_view = document.getElementById('ad_innerView');
  if (!$ad_view) return;

  // 언론사 코드는 iframe·style 등을 넣기 전에 원래 script에서 먼저 읽어둔다
  var _data = $ad_view.querySelector('script');
  var _code = (_data && _data.dataset.press_code) || '';
  var _press = {kx:5706127053,kh:2344917804,cb:4755458723,na:4643778089,ns:1961774427,do:3228137526,mh:5503765314,no:8097320821,sg:9218830809,at:1340340782,yt:2700141029,ch:3774932438,jo:7293992150,ck:3354747144,hn:2270279078,hi:2887843288,ni:7948598271,di:6536827142,ak:1383189928,mt:6345255453,mk:7466765439,se:7050449570,ae:3817781571,aj:2919632877,sb:8878536564,ed:5345080692,ee:2585123787,ey:1065008614,cz:7779672347,fn:7204957270,fr:1625327539,hk:5891875605,hr:8326467252,ss:6124095304,dn:3116456888,mw:1569487210,bt:1242184151,oh:1377915522,hm:3676775800,kb:6623908316,ny:8440935752,ht:3806173289,kv:9370874043,jt:9179302350,nt:7665527240,ob:6169995632,sv:4090627207,yn:6454982381,dg:1202655708,dd:1725399883,iu:6625275293,in:1011084019,av:6979131536,it:4352968192,nn:1726804858,dr:8099236544,th:7193348988,my:6249886685,ez:3623723349,bb:9997560005,es:8492906642,tn:9220746527,sz:7001777295,tt:4375613954,kz:3062532289,sd:8123287276,sp:6810205600,sw:2870960593,sc:9231273240,so:6618633913,sr:7726619882,st:7740143896,sh:3776848153,sk:4922408864,su:6030394836,ab:2091149823,xs:9025305409,fb:3212659802,is:8035657367,jn:1470249016,ts:1708006445,tv:3904840660,iz:9767541434,aa:4142598097,pt:6577189745,yy:3951026403,mi:8774023969,ma:1324863063,js:3202133089,cc:6949806405,kr:8582452276,ki:6758234714,bn:6886227220,en:5381573866,pd:4786128753,kp:2159965416,gd:2752644740,wh:1439563076,lh:6375091333,me:7043506873,as:9126481406,il:6141225410,hw:5538853517};
  var _slot = _press[_code] || 2106906784;

  // 바깥(페이지) 스타일: 영역 크기와 AD 배지
  var _css = '#ad_innerView{margin:0 auto;}' +
    '#ad_innerView{width:' + _adWidth + 'px;height:auto;text-align:center;position:relative;}' +
    '#ad_innerView iframe.ad_inner_view_frame{display:block;width:' + _adWidth + 'px;height:' + _adHeight + 'px;border:0;margin:0 auto;overflow:hidden;}' +
    '.ad_inner_view_box{position:absolute;top:0;left:10px;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}';
  var _style = document.createElement('style');
  _style.type = 'text/css';
  _style.styleSheet ? (_style.styleSheet.cssText = _css) : _style.appendChild(document.createTextNode(_css));
  $ad_view.appendChild(_style);

  // iframe 생성
  var _frame = document.createElement('iframe');
  _frame.className = 'ad_inner_view_frame';
  _frame.width = _adWidth;
  _frame.height = _adHeight;
  _frame.setAttribute('frameborder', '0');
  _frame.setAttribute('scrolling', 'no');
  _frame.setAttribute('marginwidth', '0');
  _frame.setAttribute('marginheight', '0');
  _frame.title = 'advertisement';
  $ad_view.appendChild(_frame);

  // iframe 안 문서: google_* 설정 → show_ads.js (파서가 넣은 script라 동기 실행됨)
  var _conf =
    'google_ad_client="ca-pub-8710503230568572";' +
    'google_ad_slot="' + _slot + '";' +
    'google_ad_height=' + _adHeight + ';' +
    'google_ad_width=' + _adWidth + ';' +
    'google_adtest="off";' +
    'google_ad_type="image,flash";' +
    'google_color_bg="ffffff";' +
    'google_color_border="ffffff";' +
    'google_color_link="ffffff";' +
    'google_encoding="euc-kr";' +
    'google_language="ko";' +
    'google_safe="high";' +
    'google_alternate_ad_url="' + googleAlternateAdUrl + '";';

  var _html = '<!doctype html><html><head><meta charset="utf-8">' +
    '<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;text-align:center;}' +
    'ins.adsbygoogle[data-ad-status="unfilled"]{display:block !important}</style>' +
    '</head><body>' +
    '<script>' + _conf + '<\/script>' +
    '<script src="' + _protocol + '//pagead2.googlesyndication.com/pagead/show_ads.js"><\/script>' +
    '</body></html>';

  var _doc = _frame.contentDocument || (_frame.contentWindow && _frame.contentWindow.document);
  if (_doc) {
    _doc.open();
    _doc.write(_html);
    _doc.close();
  }

  // AD 배지는 바깥에서 iframe 위에 겹쳐 표시
  var _adBox = document.createElement('div');
  _adBox.innerHTML = 'AD';
  _adBox.setAttribute('class', 'ad_inner_view_box');
  $ad_view.appendChild(_adBox);
})();