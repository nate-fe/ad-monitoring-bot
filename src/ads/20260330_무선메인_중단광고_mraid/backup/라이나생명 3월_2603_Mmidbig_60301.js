try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

(function () {  
  var ad_height   = '200'; //광고 높이 값
  var bgcolor     = '#b6e3ff';
  var img_path    = CyadLib.prefixUrl('https://adimg.nate.com/img/2026/02/lina/lina_mid_0227_640x400_b6e3ff.jpg');	//이미지 소재 경로
  var click_path  = CyadLib.prefixUrl('http://cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#'); //랜딩
  var alt_text    = '광고';
  var ad_id       = '#ad_mid'; //중단

  var adsEl = '<a href="' + click_path + '" style="display:block;height:' + ad_height + 'px;background:' + bgcolor + '" target="_top" ><img alt="' + alt_text + '" src="' + img_path + '" width="320" height="'+ ad_height +'" border="0"></a>';

  if( self === top ) {
    var ad_container = document.querySelectorAll(ad_id);
    ad_container.forEach(v => {
      v.style.backgroundColor = bgcolor;
      v.innerHTML = adsEl;
      v.style.height = ad_height + 'px';
    })
  } else {
    document.body.style.background = bgcolor;
    document.write(adsEl);
	window.parent.postMessage(ad_height, "*");  
    var ifm_wrap;
	if(parent.document.querySelectorAll(ad_id).length > 0) {
      ifm_wrap = parent.document.querySelectorAll(ad_id);
    } else {
      ifm_wrap = parent.document.querySelectorAll('#top_main_banner');
      document.getElementById('top_main_banner').style.height = ad_height + 'px';
    }
	ifm_wrap.forEach(v => {
      var ifm = v.querySelector('iframe');
      if(ifm) {
		ifm.height = ad_height;
	  }
	  v.style.height = ad_height + 'px';
	  v.style.backgroundColor = bgcolor;
    });
  }
})();