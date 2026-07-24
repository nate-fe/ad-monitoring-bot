(function() {
  var $ad_view = document.getElementById('ad_innerView');
  if($ad_view) {
    var _css = '#ad_innerView{height:auto;text-align:center;position:relative;}.ad_inner_view_box{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}#ad_innerView ins.adsbygoogle[data-ad-status="unfilled"]{display: none !important;}',
        _style = document.createElement('style');
    _style.type = 'text/css';
    _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
    $ad_view.appendChild(_style);
    
    var $page_script = document.createElement('script');
    $page_script.crossorigin = 'anonymous';
    $page_script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8710503230568572';
    $page_script.async = true;
    // $page_script.setAttribute('data-overlays', 'bottom');
    $ad_view.appendChild($page_script);

    var _data = $ad_view.querySelector('script');
    var _code = _data.dataset.press_code || '';
    var _press={kx:6930572216,kh:1661299202,cb:3227092930,na:5661684582,ns:4348602917,do:3904319160,mh:1722439578,no:6783194569,sg:2799755513,at:8407267424,yt:5234347161,ch:6591622874,jo:3205481017,ck:9443586306,hn:1363346920,hi:8834642839,ni:4895397821,di:3884137862,ak:4326990991,mt:7545611894,mk:2269234483,se:6279835525,ae:6016907808,aj:2293285216,sb:9980203546,ed:8130504634,ee:5849386840,ey:3943847618,cz:8994424930,fn:1103530461,cc:3031651811,fr:5466243463,hk:8790448799,hr:1841859077,ss:8802853243,dn:6176689907,mw:4782286564,bt:4855869375,oh:4690787220,hm:5326642663,kb:9916624368,ny:4939629858,ht:8603542691,kv:2313466511,jt:2758758450,nt:7819513448,ob:8343726231,sv:8687303179,yn:1790722333,dg:8941023421,dd:7627941759,iu:5001778418,in:7761234318,av:3078957114,it:6061139835,nn:2508907632,dr:7125378873,th:7569662625,my:2121894827,ez:1846562657,bb:7209139356,es:3243404808,tn:6933807180,sz:1934192567,tt:9141168124,kz:6619581024,sd:5306499356,sp:7828086452,sw:1132246788,sc:8819165112,so:4958380536,sr:5201923117,st:5127332110,sh:2332217194,sk:2680336012,su:6288408534,ab:9262056234,xs:1188087102,fb:8706053854,is:3566838439,jn:2349163529,ts:9827563834,tv:9940675097,iz:5961067488,aa:2696647881,pt:1383566215,yy:6444321203,wh:2488764325,lh:5131239530,as:2505076197,il:2006344757,mi:3262155486,ma:1175682653,js:4688348419,kr:3334904146,ki:3626586176,bn:2021822479,en:4923355972,pd:4383665462,kp:7067099742,bm:3435014486,kw:6057270409,tr:2121932817};
    var _slot = _press[_code] || 2297192630;
    
    var _ins = document.createElement('ins');
    _ins.setAttribute('class', 'adsbygoogle');
    _ins.setAttribute('data-ad-client', 'ca-pub-8710503230568572');
    _ins.setAttribute('data-ad-slot', _slot);
    _ins.style.display = 'inline-block';
    _ins.style.position = 'relative';
    _ins.style.width = '300px';
    _ins.style.height = '250px';

    $ad_view.appendChild(_ins);

    var $action_code = '(adsbygoogle = window.adsbygoogle || []).push({});';
    var $action_script = document.createElement('script');
    $action_script.innerHTML = $action_code;

    $page_script.onload = function() {
      $ad_view.appendChild($action_script); 
    }

    var _adBox = document.createElement('div');
    _adBox.innerHTML = 'AD';
    _adBox.setAttribute('class', 'ad_inner_view_box');
    _ins.appendChild(_adBox);

    
  }
})();