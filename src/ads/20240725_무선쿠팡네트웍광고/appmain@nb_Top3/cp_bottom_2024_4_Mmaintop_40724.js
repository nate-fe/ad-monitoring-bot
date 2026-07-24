(function () {
  try {
    var _el = document.querySelector('#ad_big');
    // ad_big에서 이미 호출됐을 때 또 광고 뜨는 거 방지하기
    if (document.querySelector('#ad_big > div') || document.querySelector('#ad_big_script')) {
      document.querySelector('#ad_big > div').remove();
    }
    var _script = document.createElement('script');
    _script.src = 'https://api.dnxad.com/coupang/script_320x150_v1.php?subId=natethree&layerId=ad_big'
    _script.id = 'ad_big_script'
    _el.appendChild(_script);
  } catch(e) {
    window.onload = function() {
      window.parent.postMessage({
        "method": "fnct",
        "name": "callCrossOriginAd",
        "property": {target: window.name, height: 150}
      }, '*');
    }
  }
})();
// 7/31 ㅠㅠ 광고 두 번 뜸
// (function () {
//     try {
//       var _script = document.createElement('script');
//       var _el = document.querySelector('#ad_big');
//       _script.src = 'https://api.dnxad.com/coupang/script_640x160_v1.php?subId=nate640160&layerId=ad_big'
//       _el.appendChild(_script);
//     } catch(e) {
//       window.onload = function() {
//         window.parent.postMessage({
//           "method": "fnct",
//           "name": "callCrossOriginAd",
//           "property": {target: window.name, height: 150}
//         }, '*');
//       }
//     }
//   })();


// 7/29 안 뜸 ㅠ
//   (function () {
//     try {
//       parent.document.getElementById('ad_big').height = 150;
//       parent.document.getElementById('ad_big').style.height = '150px';
//     } catch(e) {
//       window.onload = function() {
//         window.parent.postMessage({
//           "method": "fnct",
//           "name": "callCrossOriginAd",
//           "property": {target: window.name, height: 150}
//         }, '*');
//       }
//       console.log(window.name)
//     }
//     document.write('<script src="https://api.dnxad.com/coupang/script_320x150_v1.php?subId=natethree&layerId=ad_big"></script>');
//   })();


// 07.26 반영 기준 -> 안 뜸 ㅠ
//   (function () {
//     try {      
//       var $css = '#ad_big > div {margin: 0 auto;}';
//       var $style = document.createElement('style'); 
//       $style.type = 'text/css';
//       $style.styleSheet ? $style.styleSheet.cssText = $css : $style.appendChild(document.createTextNode($css));
//       var pass_url = !!ad_type && ad_type === 'app' ? 'appmain@nb_Top3?exception_ads=230165' : 'main@nb_Top3?exception_ads=230165';
//       var dnxad_divs = document.querySelectorAll('#ad_big');
//       dnxad_divs.forEach(v => {
//         var ad_script = document.createElement('script');
//         ad_script.src = '//api.dnxad.com/coupang/script_320x150_v1.php?subId=natethree&layerId=ad_big';
//         ad_script.onerror = function() {
//           var replace_script = document.createElement('script');
//           replace_script.src = '//cyad1.nate.com/js.kti/mnate/' + pass_url;
//           v.appendChild(replace_script);
//           throw new Error('network ad error');
//         }
          
//         document.head.appendChild($style);
//         v.appendChild(ad_script);
//       });
//     }catch(err){console.warn(err);}
//   })();
  