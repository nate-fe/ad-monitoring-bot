(function () {
  try {
    var _el = document.querySelector('#ad_snb');
    _el.appendChild(_div);
      
    var _script = document.createElement('script');
    _script.src = 'https://api.dnxad.com/coupang/script_320x80_v1.php?subId=nate640160&layerId=ad_snb';
    _el.appendChild(_script);
  } catch(e) {
    console.log(e)
  }
})();
// (function () {
//   try {
//     var _el = document.querySelector('#ad_snb');
//     var _div = document.createElement('div');
//     _div.id = 'ad_big1'
//     _el.appendChild(_div);
      
//     var _script = document.createElement('script');
//     _script.src = 'https://api.dnxad.com/coupang/script_320x80_v1.php?subId=nate640160&layerId=ad_big';
//     _script.onload = function(){
//         var _adBig1 = document.querySelector('#ad_big1');
//         _adBig1.querySelector('& > div').style.minWidth = '320px';
//     }
//     _el.appendChild(_script);
//   } catch(e) {
//     window.onload = function() {
//       window.parent.postMessage({
//         "method": "fnct",
//         "name": "callCrossOriginAd",
//         "property": {target: window.name, height: 150}
//       }, '*');
//     }
//   }
// })();

// (function () {
//   try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

//   var bgcolor   = '#f0f0f0';
//   var img_path  = CyadLib.prefixUrl('https://adimg.nate.com/img/2023/05/coupang/coupang_e_0530_640x160.png');	//이미지 소재 경로
//   var click_path  = CyadLib.prefixUrl('http://cyad1.nate.com/click.kti/mnate/news@snb_Top2?ads_no=230181&cmp_no=30225&img_no=397732');
//   var ad_height   = '80'; //광고 높이 값
//   var alt_text    = '광고';
//   var adsEl       = '<a href="' + click_path + '" style="display:block;height:' + ad_height + 'px;background:' + bgcolor + '" target="_blank" ><img alt="' + alt_text + '" src="' + img_path + '" width="320" height="'+ ad_height +'" border="0"></a>';
//   var ad_id       = 'ad_snb'; // snb 광고

//   if( self === top ) {
//       var target = document.getElementById(ad_id);
//       target.style.backgroundColor = bgcolor;
//       target.innerHTML = adsEl;
//   } else {
//       document.body.style.background = bgcolor;
//       document.write(adsEl);

//       var iframe = parent.document.getElementById(ad_id).querySelector('iframe');
//       iframe.height = ad_height;
//   }
// })()


// (function () {
//     try {      
//       var $_script = document.createElement('script');
//       $_script.src = '//api.dnxad.com/coupang/script_640x160_v1.php?subId=nate640160&layerId=ad_big1';
//       document.querySelector('body').appendChild($_script);
//     }catch(err){console.warn(err);}
//   })();
  