(function () {
  var ad_height = 250;
  var ad_id = '#newsMainBanner';
  var _pub_code = '1001318710';
  var _area_code = '1913411133';
  var _page_url = window.location.href;
  var _direct_url = '';
  var _head = document.querySelector('head')
  var _script = document.createElement('script');
  _script.src = 'https://cdn.nhnace.com/libs/aceat.js?pub_code=' + _pub_code;
  _script.async = 'true';
  _script.type = 'text/javascript';
  _head.appendChild(_script);
  try{
    var ad_frame = parent.document.querySelector(ad_id);
    ad_frame.querySelector('iframe').style.height = ad_height + 'px';
  }catch(err){}
  try{
    var iframe = document.createElement('iframe');
    iframe.width = '300';
    iframe.height = ad_height;
    iframe.setAttribute('frameborder', 0);
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('marginwidth', 0);
    iframe.setAttribute('marginheight', 0);
    iframe.setAttribute('vspace', 0);
    iframe.setAttribute('hspace', 0);
    iframe.setAttribute('allowtransparency', true);
    iframe.setAttribute('style', 'margin: 0 auto; overflow: hidden');
    iframe.setAttribute('allow', 'browsing-topics; attribution-reporting');
    iframe.src = 'https://cdn.nhnace.com/libs/aceadlib.html?pub_code=' + _pub_code + '&area_code=' + _area_code +'&pag=PAG&page_url=' + encodeURIComponent(_page_url) + '&direct_url=' + encodeURIComponent(_direct_url);
    document.body.appendChild(iframe);

  }catch(err){}
})();

// try {
//     parent.document.getElementById('newsMainBanner').height = 250;
//     parent.document.getElementById('newsMainBanner').style.height = '250px';
//   } catch(e) {
//     window.onload = function() {
//       var isNews = location.href.indexOf('news') > -1;
//       var isPann = location.href.indexOf('pann') > -1;
//       if(isNews) {
//         window.parent.postMessage({
//           "method": "fnct",
//           "name": "callCrossOriginAd",
//           "property": {target: window.name, height: document.body.scrollHeight}
//         }, '*');
//       }
//     }
//   }
  
//   try {
//       (function(){
//         var ttx_pub_code="1001318710";
//           var ttx_ad_area_code="1913411133";
//           var ttx_ad_area_pag="PAG";
//           var ttx_page_url=document.referrer, ttx_direct_url="http://cyad1.nate.com/js.kti/nate/nhn@rec2_Middle2";
  
//           var ttx_total_cookie_name="ttx_t_r";
//           var e=function(a){
//             a+="=";
//             for(var c=document.cookie.split(";"),d=0;d<c.length;d++){for(var b=c[d];" "==b.charAt(0);)b=b.substring(1);if(0==b.indexOf(a))return b.substring(a.length,b.length)}return""},f="";try{f=JSON.stringify(JSON.parse(e(ttx_total_cookie_name))[ttx_ad_area_code])}catch(g){}var c="";""==ttx_page_url&&(ttx_page_url=document.URL);""==c&&document.referrer&&(c=document.referrer);var a="https://cdn.nhnace.com/libs/aceadlib.html";
//           a+="?pub_code="+ttx_pub_code+"&area_code="+ttx_ad_area_code+"&pag="+encodeURIComponent(ttx_ad_area_pag);a+="&site_url="+encodeURIComponent("")+"&page_url="+encodeURIComponent(ttx_page_url)+"&refer="+encodeURIComponent(c);a+="&result="+encodeURIComponent(f)+"&bnrs_e="+encodeURIComponent(e("ttx_bnrs_e"))+"&du="+encodeURIComponent(ttx_direct_url);a+="&rndm="+Math.random()+"&cst=";
//           document.write("<script type='text/javascript' src='"+a+"' ><\/script>")})();
//   }catch(e){}
  

// (function () {
//     var ad_height = 250;
//     var ad_id = '#newsMainBanner';
//     var _pub_code = '1001318710';
//     var _area_code = '1913411133';
//     var _page_url = document.referrer;
//     var _direct_url = '';
//     var _head = document.querySelector('head')
//     var _script = document.createElement('script');
//     _script.src = 'https://cdn.nhnace.com/libs/aceat.js?pub_code=' + _pub_code;
//     _script.async = 'true';
//     _script.type = 'text/javascript';
//     _head.appendChild(_script);
//     try{
//       var ad_frame = parent.document.querySelector(ad_id);
//       ad_frame.querySelector('iframe').style.height = ad_height + 'px';
//     }catch(err){}
//     try{
//       var iframe = document.createElement('iframe');
//       iframe.width = '300';
//       iframe.height = ad_height;
//       iframe.setAttribute('frameborder', 0);
//       iframe.setAttribute('scrolling', 'no');
//       iframe.setAttribute('marginwidth', 0);
//       iframe.setAttribute('marginheight', 0);
//       iframe.setAttribute('vspace', 0);
//       iframe.setAttribute('hspace', 0);
//       iframe.setAttribute('allowtransparency', true);
//       iframe.setAttribute('style', 'margin: 0 auto; overflow: hidden');
//       iframe.setAttribute('allow', 'browsing-topics; attribution-reporting');
//       iframe.src = 'https://cdn.nhnace.com/libs/aceadlib.html?pub_code=' + _pub_code + '&area_code=' + _area_code +'&pag=PAG&page_url=' + encodeURIComponent(_page_url) + '&direct_url=' + encodeURIComponent(_direct_url);
//       document.body.appendChild(iframe);

//     }catch(err){}
//   })();

//   try {
// 	document.domain="nate.com";
// 	top.document.getElementById('newsMainBanner').style.height='250px';
// }catch(e){}

// try {
// 	(function(){var ttx_pub_code="1001318710";
// 		var ttx_ad_area_code="1623639101";
// 		var ttx_ad_area_pag="PAG";
// 		var ttx_page_url=document.referrer, ttx_direct_url="";

// 		var ttx_total_cookie_name="ttx_t_r";
// 		var e=function(a){a+="=";for(var c=document.cookie.split(";"),d=0;d<c.length;d++){for(var b=c[d];" "==b.charAt(0);)b=b.substring(1);if(0==b.indexOf(a))return b.substring(a.length,b.length)}return""},f="";try{f=JSON.stringify(JSON.parse(e(ttx_total_cookie_name))[ttx_ad_area_code])}catch(g){}var c="";""==ttx_page_url&&(ttx_page_url=document.URL);""==c&&document.referrer&&(c=document.referrer);var a="https://adx-exchange.toast.com/a_request";
// 		a+="?pub_code="+ttx_pub_code+"&area_code="+ttx_ad_area_code+"&pag="+encodeURIComponent(ttx_ad_area_pag);a+="&site_url="+encodeURIComponent("")+"&page_url="+encodeURIComponent(ttx_page_url)+"&refer="+encodeURIComponent(c);a+="&result="+encodeURIComponent(f)+"&bnrs_e="+encodeURIComponent(e("ttx_bnrs_e"))+"&du="+encodeURIComponent(ttx_direct_url);a+="&rndm="+Math.random()+"&cst=";
// 		document.write("<script type='text/javascript' src='"+a+"' ><\/script>")})();
// }catch(e){}


// (function () {
//     var ad_height = 120;
//     var ad_id = '#pann_brandAdWrap';
//     var sub_id = '1268S142178';
//     try{
//       var ad_frame = parent.document.querySelector(ad_id);
//       ad_frame.querySelector('iframe').style.height = ad_height + 'px';
//     }catch(err){}
//     try{
//       var iframe = document.createElement('iframe');
//       iframe.width = '970';
//       iframe.height = ad_height;
//       iframe.setAttribute('frameborder', 0);
//       iframe.setAttribute('scrolling', 'no');
//       iframe.setAttribute('marginwidth', 0);
//       iframe.setAttribute('marginheight', 0);
//       iframe.setAttribute('vspace', 0);
//       iframe.setAttribute('hspace', 0);
//       iframe.setAttribute('allowtransparency', true);
//       iframe.src = '//api.linkmine.co.kr/nate/dynamic.html?size=970x' + ad_height + '&subid=' + sub_id;
//       document.body.appendChild(iframe);
//     }catch(err){}
//   })();

// (function() {
//     try{
//       var $ad_id = 1785190;
//       var $ad_width = 300;
//       var $ad_height = 250;
//       var $wrapper = document.body;
//       var $passback = 'nate/cri@srec2_Middle2';
//       var $script = document.createElement('script');
//           $script.type = 'text/javascript';
//           $script.src = '//static.criteo.net/js/ld/publishertag.js';
//           $script.async = true;
//           $script.onload = function() {
//             try{
//               window.Criteo = window.Criteo || {};window.Criteo.events = window.Criteo.events || [];
//             }catch(err){}
//             try{
//               Criteo.events.push(function () {
//                 var adUnits = {
//                   placements: [
//                     {
//                       slotId: 'criteo-' + $ad_id,
//                       zoneId: $ad_id,
//                     },
//                   ],
//                 };
//                 Criteo.Passback.RequestBids(adUnits, 2000);
//               });
//             }catch(err){}
//             try{
//               Criteo.events.push(function () {
//                 Criteo.Passback.RenderAd("criteo-" + $ad_id, function () {
//                   var width = $ad_width,
//                     height = $ad_height;
//                   var slotid = "criteo-" + $ad_id;
//                   var div = document.getElementById(slotid);
//                   if (div) {
//                     var ifr = document.createElement("iframe");
//                       ifr.setAttribute("id", slotid + "_iframe"),
//                       ifr.setAttribute("frameborder", "0"),
//                       ifr.setAttribute("allowtransparency", "true"),
//                       ifr.setAttribute("hspace", "0"),
//                       ifr.setAttribute("marginwidth", "0"),
//                       ifr.setAttribute("marginheight", "0"),
//                       ifr.setAttribute("scrolling", "no"),
//                       ifr.setAttribute("vspace", "0"),
//                       ifr.setAttribute("width", width),
//                       ifr.setAttribute("height", height);
//                     div.appendChild(ifr);
//                     var htmlcode ="<html><head></head><body><script language=javascript src='//cyad1.nate.com/js.kti/"+$passback+"'></script></body></html>";
//                     var ifrd = ifr.contentWindow.document;
//                     ifrd.open();
//                     ifrd.write(htmlcode);
//                     ifrd.close();
//                   }
//                 });
//               });
//             }catch(err){}
//           }
  
//       var $div = document.createElement('div');
//       $div.id = 'criteo-' + $ad_id;
      
//       $wrapper.appendChild($script);
//       $wrapper.appendChild($div);    
//     }catch(err){console.warn(err)}
//   })();