(function() {
    var $ad_view = document.getElementById('ad_innerView');
    if($ad_view) {
      var _css = '#ad_innerView{position:relative;width:300px;height:auto;margin:0 auto;border:1px solid #e7e7e7;text-align:center;}.ad_inner_view_box{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}',
          _style = document.createElement('style');
      _style.type = 'text/css';
      _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
      $ad_view.appendChild(_style);
      
      var _adBox = document.createElement('div');
      _adBox.innerHTML = 'AD';
      _adBox.setAttribute('class', 'ad_inner_view_box');
      _adBox.setAttribute('style', 'font-size: 12px !important');
      
      var $page_script = document.createElement('script');
      $page_script.crossorigin = 'anonymous';
      $page_script.src = '//pagead2.googlesyndication.com/pagead/show_ads.js';
      
      var _data = $ad_view.querySelector('script');
      var _code = _data.dataset.press_code || '';
      var _press={kx:5111628749,kh:7546220397,cb:4920057051,na:7354648700,ns:8900143591,do:4536913678,mh:1910750337,no:7395490231,sg:6971505322,at:6116646707,yt:1719178644,ch:6779933636,jo:3571795292,ck:4153770295,hn:7593379900,hi:2357951827,ni:2258713629,di:8632550286,ak:7319468618,mt:6280298233,mk:3380223607,se:8731788486,ae:7418706817,aj:3188651915,sb:6936325234,ed:5623243560,ee:9022953596,ey:1144463572,cz:8831381901,fn:6205218566,fr:2805508537,hk:2265973557,hr:6553181859,ss:5240100186,dn:7326728547,mw:9864320026,bt:4134902073,oh:8476637619,hm:6569493721,kb:2630248711,ny:6377922035,ht:7238156681,kv:2166380131,jt:9917711795,nt:4298553604,ob:7012346852,sv:3160731756,yn:6733145258,dg:1480818575,dd:1656078399,iu:3073101849,in:7663083544,av:5036920207,it:3723838537,nn:3224310938,dr:7985096297,th:4045851286,my:9106606271,ez:1464506702,bb:6088726549,es:1228116256,tn:4775644879,sz:8959853347,tt:8359666665,kz:5467330893,sd:5733503327,sp:2394444998,sw:5227178815,sc:3914097140,so:7455199981,sr:4829036644,st:4600971783,sh:3515954979,sk:2202873309,su:1036544560,ab:1528085889,xs:7263628296,fb:3324383280,is:5275759207,jn:2749668213,ts:8037067188,tv:2301524776,iz:7661770460,aa:8675361430,pt:6348688797,yy:9158577161,mi:5219332152,ma:1044391222,js:9796871418,cc:5514011475,kr:4200929807,ki:6340842131,bn:7218809539,en:5905727860,pd:1088515456,kp:2887848130,gd:1574766466,wh:4836188776,lh:5857626407,me:5957698751,as:2018453748,il:1966482856,hw:8392290407};
      var _slot = _press[_code] || 1469639547;
  
      try {
        google_ad_client = 'ca-pub-8710503230568572';
        google_ad_slot = _slot;
        google_ad_height = 250;
        google_ad_width = 300;
        google_adtest = 'off';
        google_ad_type= 'image';
        google_color_bg = 'ffffff';
        google_color_border = 'ffffff';
        google_color_link = 'ffffff';
        google_encoding='utf-8';
        google_language='ko';
        google_safe='high';
        google_alternate_ad_url=location.protocol+'//cyad1.nate.com/html.kti/nate/google@house_x11';
      } catch(err) { console.warn(err) }
  
      $ad_view.setAttribute('style', 'font-size: 0 !important');
      $ad_view.appendChild($page_script);
      $ad_view.appendChild(_adBox);
    }
  })();
  