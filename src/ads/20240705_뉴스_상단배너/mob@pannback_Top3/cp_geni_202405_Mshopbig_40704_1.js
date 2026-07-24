(function () {
    var ad_height = 200;
    var ad_id = 'ad_big';
    var sub_id = '1268S142130';  
    try{
      parent.document.getElementById(ad_id).height = ad_height;
      parent.document.getElementById(ad_id).style.height = ad_height + 'px';
    }catch(e){
      window.onload = function() {
        window.parent.postMessage({
            target: ad_id,
            params: {
              height: ad_height
            }
          }, '*');
      }
    }  
    try{
      var _el = document.getElementById('main_banner');
      var script = document.createElement('script');
      script.src = '//ads.shople.kr/js/doc_write.js?app_code=1eL43M17QE&cnt=2&type=COUPANG_DNY_1&sub_id=' + sub_id + '&coupang_param=&use_cnt=&tsource=www.nate.com&url_action=&rpum_click=&cp_dny_id=&cp_dny_code=&width=100%&height=' + ad_height;
      _el.appendChild(script);
    }catch(err){}
  })();
  